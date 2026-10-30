#!/usr/bin/env node
// ---------------------------------------------------------------------------
// 演示用配图生成器（S29.1 收尾）
//
// 为什么不用真实照片：
//   ① 版权/隐私：演示数据不该带作者本人的生活照；
//   ② 体积：原图 1.5~3.6MB/张，首页 10 张就是 20MB+，在慢链路上直接拖垮首屏；
//   ③ 可控：抽象几何与站点的编辑式排版（米白纸感 + 衬线 + 等宽标签）一致。
//
// 产物：RuoYi-Vue-Plus/deploy/assets/covers/cNN.svg（12 张，每张 2~4KB）。
//       由 deploy.sh seed 上传到 MinIO 的 seed/covers/ 前缀后，正文与封面统一走图片域名。
//
// 跑法：node tooling/gen-seed-covers.mjs
// ---------------------------------------------------------------------------

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(HERE, '../../RuoYi-Vue-Plus/deploy/assets/covers')

/** 调色板：纸感底色 + 墨色 + 一个低饱和强调色，和站点视觉语言一致 */
const PALETTES = [
  { bg: '#F6F3EC', ink: '#1C1917', accent: '#C4643B', soft: '#E8DFD0' },
  { bg: '#14110F', ink: '#F5F1E8', accent: '#D98B5F', soft: '#2A2320' },
  { bg: '#F2F0E6', ink: '#23282E', accent: '#5C7A6B', soft: '#DCE3DA' },
  { bg: '#EDEAE3', ink: '#2B2118', accent: '#8A6A4F', soft: '#DED3C3' },
  { bg: '#101418', ink: '#E9EEF2', accent: '#6FA8B8', soft: '#1D252B' },
  { bg: '#F7F4EF', ink: '#242021', accent: '#7A5A6E', soft: '#E6DAE2' }
]

/** 每张图的几何构图（4 种），避免 12 张看起来一模一样 */
function composition(kind, p, i) {
  const W = 1200
  const H = 675
  const cx = W / 2
  const cy = H / 2

  if (kind === 0) {
    // 同心弧 + 斜线网格
    const arcs = [180, 260, 340, 420]
      .map((r, k) => `<circle cx="${W * 0.72}" cy="${cy}" r="${r}" fill="none" stroke="${p.ink}" stroke-opacity="${0.10 + k * 0.06}" stroke-width="1.2"/>`)
      .join('')
    const grid = Array.from({ length: 14 }, (_, k) => {
      const x = 60 + k * 78
      return `<line x1="${x}" y1="0" x2="${x - 180}" y2="${H}" stroke="${p.ink}" stroke-opacity="0.05" stroke-width="1"/>`
    }).join('')
    return grid + arcs +
      `<rect x="86" y="${H - 210}" width="8" height="120" fill="${p.accent}"/>` +
      `<text x="120" y="${H - 120}" font-family="ui-serif, Georgia, serif" font-size="46" fill="${p.ink}" fill-opacity="0.9">${String(i + 1).padStart(2, '0')}</text>`
  }

  if (kind === 1) {
    // 大圆环 + 水平基线 + 点阵
    const dots = []
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 16; c++) {
        dots.push(`<circle cx="${90 + c * 68}" cy="${110 + r * 88}" r="1.6" fill="${p.ink}" fill-opacity="0.16"/>`)
      }
    }
    return dots.join('') +
      `<circle cx="${W * 0.30}" cy="${cy}" r="190" fill="none" stroke="${p.accent}" stroke-opacity="0.55" stroke-width="2"/>` +
      `<circle cx="${W * 0.30}" cy="${cy}" r="120" fill="${p.soft}" fill-opacity="0.85"/>` +
      `<line x1="0" y1="${cy}" x2="${W}" y2="${cy}" stroke="${p.ink}" stroke-opacity="0.12" stroke-width="1"/>`
  }

  if (kind === 2) {
    // 阶梯色块 + 细边框
    const steps = [120, 210, 300, 390, 480]
      .map((w, k) => `<rect x="${120 + k * 130}" y="${H - 170 - k * 46}" width="96" height="${60 + k * 46}" fill="${k % 2 ? p.accent : p.ink}" fill-opacity="${0.18 + k * 0.14}"/>`)
      .join('')
    return steps +
      `<rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="${p.ink}" stroke-opacity="0.22" stroke-width="1.5"/>`
  }

  // 3：对角带 + 大字
  return `<path d="M0 ${H} L${W * 0.55} 0 L${W * 0.78} 0 L${W * 0.2} ${H} Z" fill="${p.soft}" fill-opacity="0.85"/>` +
    `<path d="M${W * 0.42} ${H} L${W} ${H * 0.22}" stroke="${p.accent}" stroke-opacity="0.7" stroke-width="3"/>` +
    `<text x="${W * 0.62}" y="${H * 0.62}" font-family="ui-serif, Georgia, serif" font-size="150" fill="${p.ink}" fill-opacity="0.16">${String(i + 1).padStart(2, '0')}</text>`
}

const svg = (i) => {
  const p = PALETTES[i % PALETTES.length]
  const kind = i % 4
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-label="示意图 ${i + 1}">
<rect width="1200" height="675" fill="${p.bg}"/>
${composition(kind, p, i)}
<rect width="1200" height="675" fill="url(#v)"/>
<defs><linearGradient id="v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.05"/></linearGradient></defs>
</svg>
`
}

mkdirSync(OUT_DIR, { recursive: true })
const N = 12
let total = 0
for (let i = 0; i < N; i++) {
  const body = svg(i)
  total += body.length
  writeFileSync(resolve(OUT_DIR, `c${String(i + 1).padStart(2, '0')}.svg`), body)
}
console.log(`已生成 ${N} 张示意图 → deploy/assets/covers/（合计 ${(total / 1024).toFixed(1)}KB）`)
