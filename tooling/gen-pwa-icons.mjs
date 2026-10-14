#!/usr/bin/env node
// S17 PWA 图标生成脚本（纯 Node，零依赖）：本机无 PIL / rsvg / inkscape / ImageMagick，
// 故手写 PNG 编码器（zlib + IHDR/IDAT/IEND/CRC32）+ 几何光栅化。
// 设计复刻 public/favicon.svg 的双圆角框品牌标记（深色模式配色，不透明底），
// 产出 manifest 用 PNG（192/512/maskable-512）与 iOS apple-touch-icon（180）。
// 用法：node tooling/gen-pwa-icons.mjs（幂等，重复执行覆盖 public/icons/）。

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

// 品牌色（assets/css/tokens.css 深色 --bg；favicon.svg 深色模式描边色）
const BG = [0x14, 0x12, 0x0f]
const BACK = [0xf4, 0xf1, 0xea] // 后框：暖白
const FRONT = [0xff, 0xd5, 0x00] // 前框：品牌黄

// 40×40 设计空间中的双圆角框（与 favicon.svg 几何一致）
const RECTS = [
  { x: 6, y: 10, w: 22, h: 22, rx: 6, stroke: 2.8, color: BACK },
  { x: 12, y: 6, w: 22, h: 22, rx: 6, stroke: 2.8, color: FRONT }
]

const SSAA = 4 // 4×4 超采样抗锯齿
const DESIGN = 40

/** 圆角矩形有向距离（负值=在边界内侧）；p 为设计空间坐标 */
function sdRoundRect(px, py, r) {
  const hw = r.w / 2
  const hh = r.h / 2
  const qx = Math.abs(px - (r.x + hw)) - (hw - r.rx)
  const qy = Math.abs(py - (r.y + hh)) - (hh - r.rx)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r.rx
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** 描边覆盖度：|d| 在 stroke/2 内为 1，一个像素内平滑过渡到 0 */
function strokeAlpha(d, halfStroke, aa) {
  return 1 - smoothstep(halfStroke, halfStroke + aa, Math.abs(d))
}

/**
 * 光栅化 size×size RGBA。
 * @param glyphScale 绕设计中心 (20,20) 的 glyph 缩放（maskable 用 <1 收缩进安全区）
 */
function render(size, glyphScale = 1) {
  const rgba = new Uint8Array(size * size * 4)
  const unit = DESIGN / size // 一个输出像素对应的设计单位
  const aa = unit // 抗锯齿过渡带宽 = 1 像素
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = BG[0]
      let g = BG[1]
      let b = BG[2]
      for (let sy = 0; sy < SSAA; sy++) {
        for (let sx = 0; sx < SSAA; sx++) {
          const px = (x + (sx + 0.5) / SSAA) * unit
          const py = (y + (sy + 0.5) / SSAA) * unit
          // glyph 缩放（绕设计中心）
          const gx = DESIGN / 2 + (px - DESIGN / 2) * glyphScale
          const gy = DESIGN / 2 + (py - DESIGN / 2) * glyphScale
          let sr = r
          let sg = g
          let sb = b
          for (const rect of RECTS) {
            const a = strokeAlpha(sdRoundRect(gx, gy, rect), rect.stroke / 2, aa)
            if (a > 0) {
              sr += (rect.color[0] - sr) * a
              sg += (rect.color[1] - sg) * a
              sb += (rect.color[2] - sb) * a
            }
          }
          // 超采样均值：以首样本为基逐步混入（等价加权，避免额外缓冲）
          const w = 1 / (SSAA * SSAA)
          r += (sr - r) * w
          g += (sg - g) * w
          b += (sb - b) * w
        }
      }
      const i = (y * size + x) * 4
      rgba[i] = Math.round(r)
      rgba[i + 1] = Math.round(g)
      rgba[i + 2] = Math.round(b)
      rgba[i + 3] = 255
    }
  }
  return rgba
}

// ── PNG 编码（color type 6 = RGBA8，filter 0） ──

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // [10..12] compression / filter / interlace = 0
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4)
    raw[rowStart] = 0 // filter: none
    rgba.copy
      ? rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4)
      : Buffer.from(rgba.buffer, y * width * 4, width * 4).copy(raw, rowStart + 1)
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

// ── 产物 ──

mkdirSync(OUT_DIR, { recursive: true })

const icons = [
  { file: 'icon-192.png', size: 192, scale: 1 }, // manifest purpose any
  { file: 'icon-512.png', size: 512, scale: 1 }, // manifest purpose any
  { file: 'icon-maskable-512.png', size: 512, scale: 0.81 }, // maskable 安全区（glyph 收缩至中心 ~57%）
  { file: 'apple-touch-icon-180.png', size: 180, scale: 1 } // iOS 主屏（系统自套圆角）
]

for (const { file, size, scale } of icons) {
  const png = encodePng(size, size, render(size, scale))
  writeFileSync(join(OUT_DIR, file), png)
  console.log(`${file}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`)
}
console.log('done ->', OUT_DIR)
