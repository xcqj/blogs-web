// 正文首图 → 自动封面（配合 D31：正文与封面都存后端返回的真实 URL，故可直接复用 <img src>）。
// 仅在客户端调用（作者编辑页 ssr:false），不会在服务端执行 DOMParser。
// 规则与后端 SdBlogArticleServiceImpl.validateCoverUrl() 的白名单保持一致：只接受 / 、http(s):// 开头，
// 跳过 data:/blob:/oss: 等无法直接展示的 URI。
export function pickFirstImage(html?: string | null): string | null {
  if (!html || !html.includes('<img')) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const src = doc.querySelector('img')?.getAttribute('src')?.trim();
  if (!src) return null;
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/') ? src : null;
}
