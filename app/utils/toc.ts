// =============================================================================
// 文章目录（S27）
//
// 为什么用正则解析而不是在客户端扫 DOM：
//   详情页是 ssr: true 的公共页，正文通过 v-html 输出。若等 hydration 后再扫 .prose h2
//   加 id，会出现「首屏无目录 → 水合后突然出现」的跳动，且锚点链接不存在于 SSR 输出里
//   （影响分享与爬虫）。所以这里做成纯函数，SSR 与 CSR 结果完全一致。
//
// 锚点 id 用序号（sec-1 / sec-2）而非标题文本：
//   中文 slug 化会产生 %E4%B8%AD 这类丑陋锚点，且重复标题会撞 id。
// =============================================================================

export interface TocItem {
  /** 2 = h2，3 = h3 */
  level: 2 | 3
  /** 标题内的纯文本（已剥标签、已解码实体） */
  text: string
  /** 锚点 id */
  id: string
}

export interface TocResult {
  /** 标题上注入了 id 的 HTML */
  html: string
  /** 目录项；空标题不计入 */
  items: TocItem[]
}

/** 匹配 h2/h3 整块；标题内部允许任意内容（含 <code>） */
const HEADING_RE = /<h([23])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/gi
const ID_ATTR_RE = /\sid=["']([^"']+)["']/i

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' '
}

function decodeEntities(s: string): string {
  return s.replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, (m) => ENTITIES[m] ?? m)
}

/** 剥掉标题内部的标签，压缩空白，解码实体 */
function headingText(inner: string): string {
  return decodeEntities(inner.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 从正文 HTML 生成目录，同时给标题注入锚点 id。
 *
 * 幂等：已带 id 的标题原样保留并直接纳入目录（第二次调用不会重复注入、也不会改变 items）。
 * 若正文里已有作者手写的 id，新生成的 sec-N 会跳过已被占用的编号。
 *
 * @param html 后端净化后的正文 HTML
 */
export function buildToc(html: string): TocResult {
  if (!html) {
    return { html: '', items: [] }
  }

  // 第一遍：收集已存在的 id，避免新生成的 sec-N 与它们撞号
  const used = new Set<string>()
  for (const m of html.matchAll(HEADING_RE)) {
    const exist = ID_ATTR_RE.exec(m[2] ?? '')
    if (exist) {
      used.add(exist[1])
    }
  }

  const items: TocItem[] = []

  const out = html.replace(HEADING_RE, (whole, lvl: string, attrs: string, inner: string) => {
    const level = Number(lvl) as 2 | 3
    const text = headingText(inner)
    // 空标题（只有空白 / 只有图片）不进目录，也不注入 id
    if (!text) {
      return whole
    }

    const exist = ID_ATTR_RE.exec(attrs ?? '')
    if (exist) {
      items.push({ level, text, id: exist[1] })
      return whole
    }

    let n = used.size + 1
    while (used.has(`sec-${n}`)) {
      n += 1
    }
    const id = `sec-${n}`
    used.add(id)
    items.push({ level, text, id })

    return `<h${level}${attrs ?? ''} id="${id}">${inner}</h${level}>`
  })

  return { html: out, items }
}
