/**
 * 正文代码块语法高亮（S24 / 方案 B：保存时高亮，D43）。
 *
 * 设计要点：
 * 1. **只在作者保存时执行**（编辑器路由 `ssr:false`）——读者端零运行时开销，只多一份静态 CSS。
 * 2. **输出 class 而非 inline style**：`transformerStyleToClass` 把 shiki 的 `style="color:#xxx"`
 *    转成 `class="tok-xxxxxx"`，后端只需校验类名格式（`^tok-[a-z0-9]+$`），彻底规避 style 注入面。
 * 3. **`structure: 'inline'`**：默认输出会包一层 `<span class="line">`，那个 class 不带 `tok-` 前缀
 *    会被后端剥掉（且 `line` 本身也没用）。inline 模式下直接是 `tok-*` 序列，只含 `<br>` 分行。
 * 4. **换行约定与 T26-a 对齐**：inline 模式用 `<br>` 分行，这里再转回 `\n` 入库，
 *    与 `normalizeCodeNewlines()` 的约定一致（读者端靠 `.prose pre { white-space: pre }` 渲染）。
 * 5. **五道防线**：未知语言 / 语言包加载失败 / 超长块 / 已高亮块 / 整体异常，一律回落原文，
 *    **绝不阻断发文**。
 */
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { transformerStyleToClass } from '@shikijs/transformers'

/** 深浅双主题一次生成：同一份 HTML 靠 `--shiki-light/dark` 变量切换，不需要两套内容 */
const THEMES = { light: 'github-light', dark: 'github-dark' } as const

/** 与后端 `SAFE_TOKEN_CLASS` 约定一致的前缀 */
const CLASS_PREFIX = 'tok-'

/** 超长块跳过：800 行以上高亮会让保存卡顿，收益也低 */
const MAX_LINES = 800

/**
 * 语言注册表：只登记博客实际会用到的 12 种。
 * 用显式 map 而非动态拼路径，让 Vite 的代码分割结果可预测（每种语言一个独立 chunk）。
 */
const LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  javascript: () => import('shiki/langs/javascript.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  vue: () => import('shiki/langs/vue.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  rust: () => import('shiki/langs/rust.mjs'),
  go: () => import('shiki/langs/go.mjs')
}

/** 别名归一：作者在编辑器里选的语言名不一定等于 shiki 的 id */
const LANG_ALIAS: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  python3: 'python',
  sh: 'shellscript',
  shell: 'shellscript',
  zsh: 'shellscript',
  bash: 'shellscript',
  htm: 'html'
}

let highlighterPromise: Promise<HighlighterCore> | null = null

/** 单例初始化：core + JS 正则引擎（避开约 200KB 的 oniguruma wasm），主题预载，语言按需 */
function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
      langs: [],
      engine: createJavaScriptRegexEngine()
    }).catch((e) => {
      // 初始化失败就把 promise 复位，下次保存还能重试（不要永久降级）
      highlighterPromise = null
      throw e
    })
  }
  return highlighterPromise
}

/** 从 `<code class="language-xxx">` 里取语言并归一；取不到或未登记返回 null */
function resolveLang(codeAttrs: string): string | null {
  const raw = /language-([\w+#-]+)/i.exec(codeAttrs)?.[1]?.toLowerCase()
  if (!raw) return null
  const normalized = LANG_ALIAS[raw] ?? raw
  return LANG_LOADERS[normalized] ? normalized : null
}

/** `<code>` 内的 HTML 片段 → 纯文本（先处理 <br> 换行，再剥标签，最后解实体） */
function toPlainText(inner: string): string {
  return inner
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // &amp; 必须最后替换，否则 &amp;lt; 会被二次解码成 <
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

/** 对单个块着色；失败返回 null（调用方保持原文） */
async function renderBlock(hl: HighlighterCore, text: string, lang: string): Promise<string | null> {
  try {
    await hl.loadLanguage(LANG_LOADERS[lang]() as never)
    const conv = transformerStyleToClass({ classPrefix: CLASS_PREFIX })
    const html = hl.codeToHtml(text, {
      lang,
      themes: THEMES,
      defaultColor: false,
      structure: 'inline',
      transformers: [conv]
    })
    // inline 模式用 <br> 分行；转回 \n 与入库约定一致（T26-a）
    return html.replace(/<br\s*\/?>/gi, '\n')
  } catch (e) {
    // 只报语言名，不打印正文——避免把作者文章写进控制台
    console.warn(`[highlight] 语言 ${lang} 着色失败，该块保持纯文本`, e)
    return null
  }
}

/**
 * 保存前调用：把正文里所有 `<pre><code class="language-x">` 着色。
 * 任何异常都返回入参原文，绝不抛出。
 */
export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html || !html.includes('<pre')) return html

  try {
    // 只匹配「pre 内直接是 code」的标准代码块结构
    const blocks = [...html.matchAll(/<pre(\s[^>]*)?>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi)]
    if (!blocks.length) return html

    const hl = await getHighlighter()
    let out = html

    // 倒序替换：从后往前改，前面的 match.index 才不会被已替换内容影响
    for (let i = blocks.length - 1; i >= 0; i--) {
      const m = blocks[i]
      const [full, preAttrs = '', codeAttrs, inner] = m
      // 已高亮过（含 tok- 类）直接跳过，保证多次保存幂等
      if (inner.includes(`class="${CLASS_PREFIX}`)) continue
      const lang = resolveLang(codeAttrs)
      if (!lang) continue
      const text = toPlainText(inner)
      if (text.split('\n').length > MAX_LINES) continue

      const highlighted = await renderBlock(hl, text, lang)
      if (highlighted === null) continue

      const replacement = `<pre${preAttrs}><code${codeAttrs}>${highlighted}</code></pre>`
      out = out.slice(0, m.index) + replacement + out.slice(m.index + full.length)
    }
    return out
  } catch (e) {
    console.warn('[highlight] 高亮流程异常，正文按原文提交', e)
    return html
  }
}
