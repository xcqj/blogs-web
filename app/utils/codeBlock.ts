/**
 * 代码块换行规范化（S24 / T26-a，2026-10-27）。
 *
 * 背景（T25 实测）：WangEditor 的 `getHtml()` 用 `<br>` 表示代码块内的换行，
 * 但它的 `setHtml()` **不认** `<br>`——`a<br>b` 读回变成 `ab`。
 * 结果：「作者打开编辑页看一眼 → 直接保存」就会把多行代码压平，保存几次后代码块变成一行。
 *
 * 约定：代码块内换行**入库统一用 `\n`**，读者站靠 `.prose pre { white-space: pre }` 渲染。
 * 这样往返就稳定了：
 *
 *   编辑器内部（Slate 用 `\n`）
 *     → getHtml()     产出 `<br>`   → normalizeCodeNewlines 转回 `\n` → 入库
 *     → setHtml(`\n`) 正常识别      → 显示时又变回多行
 *
 * 只处理 `<pre>` 内部；段落里的 `<br>`（作者手动的软换行）必须原样保留。
 */
export function normalizeCodeNewlines(html: string): string {
  if (!html || !html.includes('<pre')) return html;
  // 非贪婪匹配到最近的 </pre>：pre 不嵌套，安全
  return html.replace(/<pre(\s[^>]*)?>([\s\S]*?)<\/pre>/gi, (_m, attrs: string | undefined, inner: string) => {
    const normalized = inner.replace(/<br\s*\/?>/gi, '\n');
    return `<pre${attrs ?? ''}>${normalized}</pre>`;
  });
}
