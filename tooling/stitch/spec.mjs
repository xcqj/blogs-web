// Stitch HTML → 规格抽取器
//
// 为什么需要它：Stitch 只能产出「截图 + Tailwind CDN 的静态 HTML」，落地是「Vue 组件 + token 变量」。
// 中间那层回译若靠看图，容器的 80px 差、区块头用的是等宽小字还是衬线标题、边框有没有渲染，
// 这些肉眼几乎看不出来；靠人逐项比又太慢。此脚本把 HTML 抽成可比对的清单。
//
// 用法：
//   node tooling/stitch/spec.mjs design/stitch/html/xxx.html          # 人读
//   node tooling/stitch/spec.mjs design/stitch/html/xxx.html --json   # 机器读
//
// 输出六段：颜色 / 字号 / 圆角与容器 / 间距 / 结构骨架 / 可见文本（用来抓编造数据）
// 判读原则：结构、数值 → 可以抄进 token；文本 → 一律当编造，落地换真实接口值。

import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('用法: node tooling/stitch/spec.mjs <stitch.html> [--json]')
  process.exit(1)
}
const asJson = process.argv.includes('--json')
const html = readFileSync(file, 'utf8')

const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1)
const sortByCount = (map) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ value: v, count: n }))

/* ---------- 1. 颜色 ---------- */
const colors = new Map()
for (const m of html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) bump(colors, m[0].toLowerCase())
for (const m of html.matchAll(/rgba?\([^)]+\)/g)) bump(colors, m[0].replace(/\s+/g, ''))

/* ---------- 2. 字号 ---------- */
const fonts = new Map()
for (const m of html.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) bump(fonts, `${m[1]}px`)
for (const m of html.matchAll(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\b/g)) bump(fonts, `tw:${m[1]}`)

/* ---------- 3. 圆角 / 容器 / 行高 / 字距 ---------- */
const radii = new Map()
for (const m of html.matchAll(/rounded-\[(\d+(?:\.\d+)?)px\]/g)) bump(radii, `${m[1]}px`)
for (const m of html.matchAll(/\brounded(-(sm|md|lg|xl|2xl|3xl|full))?\b/g)) bump(radii, `tw:${m[1] || 'DEFAULT'}`)

const containers = new Map()
for (const m of html.matchAll(/max-w-\[(\d+)px\]/g)) bump(containers, `${m[1]}px`)
for (const m of html.matchAll(/\bmax-w-(sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/g)) bump(containers, `tw:${m[1]}`)

const leadings = new Map()
for (const m of html.matchAll(/leading-\[(?:[^\]]*?)(\d+(?:\.\d+)?)(?:px)?[^\]]*\]/g)) bump(leadings, m[0])
for (const m of html.matchAll(/\bleading-(none|tight|snug|normal|relaxed|loose)\b/g)) bump(leadings, `tw:${m[1]}`)

const tracking = new Map()
for (const m of html.matchAll(/tracking-\[([^\]]+)\]/g)) bump(tracking, m[1])
for (const m of html.matchAll(/\btracking-(tight|normal|wide|wider|widest)\b/g)) bump(tracking, `tw:${m[1]}`)

/* ---------- 4. 间距（只看区块级，避免噪声） ---------- */
const spacing = new Map()
for (const m of html.matchAll(/\b(py|pt|pb|px|gap|mb|mt)-(\d+(?:\.\d+)?|\[[^\]]+\])/g)) {
  // 只收 ≥8 的档位，1~2 级细节落地时由 token 决定，不需要照抄
  const n = Number.parseFloat(String(m[2]).replace(/[[\]]/g, ''))
  if (!Number.isFinite(n) || n >= 2) bump(spacing, `${m[1]}-${m[2]}`)
}

/* ---------- 5. 结构骨架 ---------- */
// 只取 section / article / aside / header / footer / main，带一层缩进还原层级
const struct = []
{
  const tagRe = /<(\/?)(section|article|aside|header|footer|main|nav)\b([^>]*)>/g
  let depth = 0
  let m
  while ((m = tagRe.exec(html))) {
    const [, closing, tag, attrs] = m
    if (closing) {
      depth = Math.max(0, depth - 1)
      continue
    }
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || ''
    // 只留能说明版式的类，丢掉纯装饰
    const keep = cls
      .split(/\s+/)
      .filter((c) =>
        /^(grid|flex|col-span|order|sticky|fixed|absolute|max-w|min-h|h-|w-|py-|pt-|pb-|px-|gap-|border|bg-|text-\[|rounded)/.test(c)
      )
      .slice(0, 10)
      .join(' ')
    struct.push(`${'  '.repeat(depth)}<${tag}> ${keep}`)
    depth++
  }
}

/* ---------- 6. 可见文本（抓编造数据用） ---------- */
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, '\n')
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => s.length > 1 && !/^[\s·/|,，。.!！?？\-—+→←↑↓]+$/.test(s))

// 去重保序
const seen = new Set()
const uniqText = text.filter((s) => (seen.has(s) ? false : (seen.add(s), true)))

const out = {
  file,
  colors: sortByCount(colors),
  fontSize: sortByCount(fonts),
  radius: sortByCount(radii),
  container: sortByCount(containers),
  leading: sortByCount(leadings),
  tracking: sortByCount(tracking),
  spacing: sortByCount(spacing),
  struct,
  text: uniqText
}

if (asJson) {
  console.log(JSON.stringify(out, null, 2))
  process.exit(0)
}

const line = (t) => console.log(`\n${t}`)
const list = (arr, n = 12) =>
  arr.slice(0, n).forEach((x) => console.log(`  ${String(x.count).padStart(3)}×  ${x.value}`))

line(`=== ${file} ===`)

line('【颜色】（落地必须能对上 token，对不上的就是它自己发明的）')
list(out.colors, 20)

line('【字号】')
list(out.fontSize, 16)

line('【圆角】')
list(out.radius, 8)

line('【容器】')
list(out.container, 6)

line('【行高 / 字距】')
list(out.leading, 8)
list(out.tracking, 8)

line('【间距】')
list(out.spacing, 14)

line('【结构骨架】')
out.struct.forEach((s) => console.log('  ' + s))

line(`【可见文本】（共 ${out.text.length} 条，全部按"编造"处理，落地换真实值）`)
out.text.slice(0, 60).forEach((t) => console.log('  · ' + t))
if (out.text.length > 60) console.log(`  … 其余 ${out.text.length - 60} 条用 --json 查看`)
