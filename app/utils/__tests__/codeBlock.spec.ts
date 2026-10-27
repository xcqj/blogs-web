import { describe, expect, it } from 'vitest'
import { normalizeCodeNewlines } from '../codeBlock'

// 这组用例守的是「多行代码被压平」那个回归：
// WangEditor 的 getHtml 用 <br> 表示代码块内换行，而 setHtml 不认 <br>（实测 a<br>b → ab），
// 所以入库前必须把 pre 内的 <br> 转回 \n。

describe('normalizeCodeNewlines', () => {
  it('代码块内的 <br> 转成换行', () => {
    expect(normalizeCodeNewlines('<pre><code>a<br>b</code></pre>')).toBe('<pre><code>a\nb</code></pre>')
  })

  it('大小写与自闭合形式都识别', () => {
    expect(normalizeCodeNewlines('<pre><code>a<BR>b<br/>c</code></pre>')).toBe('<pre><code>a\nb\nc</code></pre>')
  })

  it('多个代码块各自处理', () => {
    const html = '<pre><code>1<br>2</code></pre><p>中间</p><pre><code>3<br>4</code></pre>'
    expect(normalizeCodeNewlines(html)).toBe('<pre><code>1\n2</code></pre><p>中间</p><pre><code>3\n4</code></pre>')
  })

  it('段落里的手写换行不被误伤', () => {
    const html = '<p>x<br>y</p><pre><code>c<br>d</code></pre>'
    expect(normalizeCodeNewlines(html)).toBe('<p>x<br>y</p><pre><code>c\nd</code></pre>')
  })

  it('保留 pre 上的属性', () => {
    expect(normalizeCodeNewlines('<pre class="x" data-lang="js"><code>e<br>f</code></pre>'))
      .toBe('<pre class="x" data-lang="js"><code>e\nf</code></pre>')
  })

  it('没有 pre 时原样返回（含空值）', () => {
    expect(normalizeCodeNewlines('<p>a<br>b</p>')).toBe('<p>a<br>b</p>')
    expect(normalizeCodeNewlines('')).toBe('')
  })

  it('幂等：重复调用结果不变', () => {
    const once = normalizeCodeNewlines('<pre><code>a<br>b</code></pre>')
    expect(normalizeCodeNewlines(once)).toBe(once)
  })
})
