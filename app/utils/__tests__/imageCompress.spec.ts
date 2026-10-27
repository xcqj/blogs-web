import { describe, expect, it } from 'vitest'
import { compressImage } from '../imageCompress'

// 只覆盖「跳过」分支——它们决定了压缩不会把上传搞坏。
// canvas 缩放那条路需要真实 canvas，为它引入 happy-dom 不划算；该路径在 S27 已由浏览器实测覆盖。

function makeFile(name: string, type: string, size = 1024): File {
  // File 在 Node 20+ 是全局可用的
  return new File([new Uint8Array(size)], name, { type })
}

describe('compressImage 的跳过规则', () => {
  it('GIF 原样返回：canvas 只取首帧，压了会毁掉动图', async () => {
    const gif = makeFile('a.gif', 'image/gif')
    expect(await compressImage(gif)).toBe(gif)
  })

  it('SVG 原样返回：矢量图无像素可压', async () => {
    const svg = makeFile('a.svg', 'image/svg+xml')
    expect(await compressImage(svg)).toBe(svg)
  })

  it('无 DOM 环境原样返回（Node 下天然走这条分支）', async () => {
    const png = makeFile('a.png', 'image/png', 2048)
    expect(await compressImage(png)).toBe(png)
  })

  it('返回的是同一个引用，不是副本', async () => {
    const jpg = makeFile('a.jpg', 'image/jpeg', 4096)
    const out = await compressImage(jpg, { maxEdge: 100, quality: 0.5 })
    expect(out).toBe(jpg)
  })
})
