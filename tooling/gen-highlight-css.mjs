/**
 * 生成代码高亮 token CSS（S24 / T28）。
 *
 * 为什么需要离线生成：shiki 的 `transformerStyleToClass` 会在运行时把
 * `style="color:#xxx"` 转成 `class="tok-xxxxxx"`，但**颜色定义必须预先存在 CSS 里**——
 * 读者端没有任何 shiki 代码，只靠这份静态表着色。
 *
 * 做法：对 12 种语言各跑一段覆盖常见 token 的样本，合并 `getCSS()` 输出并按类名去重。
 * GitHub 主题的色板是有限的（约 30 种），跑全语言可确保不漏。
 *
 * 用法：node tooling/gen-highlight-css.mjs
 * 产物：app/assets/css/highlight.css（提交入库，读者端引入）
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { transformerStyleToClass } from '@shikijs/transformers'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../app/assets/css/highlight.css')

const THEMES = { light: 'github-light', dark: 'github-dark' }
const LANGS = [
  'javascript', 'typescript', 'html', 'css', 'vue',
  'java', 'json', 'shellscript', 'sql', 'python', 'rust', 'go'
]

// 每种语言一段短样本：关键字 / 字符串 / 数字 / 注释 / 函数 / 类 / 类型 / 标签 / 属性 / 正则
const SAMPLES = {
  javascript: 'import x from "y"\nconst re = /ab+c/gi // 注释\nclass A extends B { async f(n = 0) { return `t${n}` } }',
  typescript: 'interface P<T> { id: number }\nexport const f = (p: P<string>): void => { console.log(p) } // 注释',
  html: '<!doctype html>\n<div class="a" data-x="1"><!-- c --><span>文本</span></div>',
  css: ':root { --a: #fff }\n.a > .b:hover { color: red; margin: 0 8px } /* 注释 */',
  vue: '<template><div :class="x">{{ y }}</div></template>\n<script setup>\nconst x = 1\n</script>',
  java: '@Override\npublic final class A<T> implements B {\n  private static final int N = 1; // 注释\n}',
  json: '{\n  "a": 1,\n  "b": [true, null, "s"]\n}',
  shellscript: '#!/bin/bash\nfor f in *.txt; do\n  echo "$f" | grep -q x && rm -f "$f"\ndone # 注释',
  sql: 'SELECT a.id, COUNT(*) AS n FROM t a WHERE a.x > 1 GROUP BY a.id -- 注释',
  python: 'from typing import List\n\nclass A(B):\n    def f(self, n: int = 0) -> List[str]:\n        return [str(n)]  # 注释',
  rust: 'impl<T: Clone> Buf<T> {\n    pub fn new(n: usize) -> Self { Self { v: Vec::with_capacity(n) } }\n} // 注释',
  go: 'package main\n\nfunc main() {\n\tm := map[string]int{"a": 1}\n\tfmt.Println(m, nil) // 注释\n}'
}

const hl = await createHighlighterCore({
  themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
  langs: [],
  engine: createJavaScriptRegexEngine()
})

const ruleMap = new Map() // className -> rule text

for (const lang of LANGS) {
  await hl.loadLanguage(import(`shiki/langs/${lang}.mjs`))
  const conv = transformerStyleToClass({ classPrefix: 'tok-' })
  hl.codeToHtml(SAMPLES[lang] ?? 'a', {
    lang,
    themes: THEMES,
    defaultColor: false,
    structure: 'inline',
    transformers: [conv]
  })
  for (const rule of conv.getCSS().split('}').map((s) => s.trim()).filter(Boolean)) {
    const m = /^\.(tok-[a-z0-9]+)\s*\{/.exec(rule)
    if (m) ruleMap.set(m[1], `${rule}}`)
  }
}

const classes = [...ruleMap.keys()].sort()
const rules = classes.map((c) => ruleMap.get(c))

const css = `/* 本文件由 tooling/gen-highlight-css.mjs 生成，请勿手改。
   改动方式：修改脚本里的样本或主题后重新运行 \`node tooling/gen-highlight-css.mjs\`。
   内容 = GitHub Light/Dark 双主题的 token 色，共 ${classes.length} 条；
   颜色以 CSS 变量承载，由下方应用层按当前主题选取，因此同一份正文 HTML 在深浅主题下自动变色。 */

/* 应用层：shiki 的 token class 只声明变量，真正上色靠这两条 */
.prose pre span[class^='tok-'] {
  color: var(--shiki-light);
}
.dark .prose pre span[class^='tok-'] {
  color: var(--shiki-dark);
}

/* token 色板（浅/深各一份，一次生成） */
${rules.join('\n')}
`

writeFileSync(OUT, css, 'utf8')
console.log(`已生成 ${OUT}`)
console.log(`token 类 ${classes.length} 个，文件 ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`)
