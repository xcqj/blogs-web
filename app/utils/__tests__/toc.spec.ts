import { describe, expect, it } from 'vitest'
import { buildToc } from '../toc'

describe('buildToc', () => {
  it('提取 h2/h3 并按序号注入锚点', () => {
    const { items, html } = buildToc('<h2>背景</h2><p>正文</p><h3>细节</h3>')

    expect(items).toEqual([
      { level: 2, text: '背景', id: 'sec-1' },
      { level: 3, text: '细节', id: 'sec-2' }
    ])
    expect(html).toContain('<h2 id="sec-1">背景</h2>')
    expect(html).toContain('<h3 id="sec-2">细节</h3>')
  })

  it('标题里的行内标签只取文字，不进目录', () => {
    const { items } = buildToc('<h2>用 <code>spring-boot</code> 启动</h2>')
    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('用 spring-boot 启动')
  })

  it('解码 HTML 实体（目录文字可读，正文 HTML 保持原样）', () => {
    const { items, html } = buildToc('<h2>A &amp; B</h2>')
    expect(items[0].text).toBe('A & B')
    expect(html).toContain('A &amp; B')
  })

  it('空标题跳过，不占编号', () => {
    const { items } = buildToc('<h2>   </h2><h2>有效</h2>')
    expect(items).toEqual([{ level: 2, text: '有效', id: 'sec-1' }])
  })

  it('没有标题时返回空目录', () => {
    const { items, html } = buildToc('<p>只有段落</p>')
    expect(items).toEqual([])
    expect(html).toBe('<p>只有段落</p>')
  })

  it('已有 id 的标题原样保留，新锚点避开已占用编号', () => {
    const { items, html } = buildToc('<h2 id="custom-1">手写锚点</h2><h2>另一个</h2>')
    expect(items.map((i) => i.id)).toEqual(['custom-1', 'sec-2'])
    expect(html).toContain('id="custom-1"')
    expect(html).toContain('id="sec-2"')
  })

  it('幂等：对结果再跑一次，产物与目录完全不变', () => {
    const once = buildToc('<h2>甲</h2><h3>乙</h3>')
    const twice = buildToc(once.html)

    expect(twice.items).toEqual(once.items)
    expect(twice.html).toBe(once.html)
  })

  it('空输入返回空结果', () => {
    expect(buildToc('')).toEqual({ html: '', items: [] })
  })
})
