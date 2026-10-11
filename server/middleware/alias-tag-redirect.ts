// alias → canonical 的 301（契约 §7.3，D28：由 Nitro server middleware 原生实现，边缘层方案作废）。
// 仅拦 /tag/{slug}：命中 alias 时后端返回的是 canonical 标签，其 slug 与请求 slug 不同 → 301 到规范地址；
// 相等则放行由页面渲染。任何解析异常一律放行（交给页面按空态/404 处理），绝不在中间件里制造 500。
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const m = /^\/tag\/([^/]+)\/?$/.exec(url.pathname)
  if (!m) {
    return
  }
  // 只对 GET 导航做 301，避免影响资源请求
  if (event.method !== 'GET') {
    return
  }
  const reqSlug = decodeURIComponent(m[1])
  try {
    const tag = await blogGet<{ slug?: string } | null>(event, `/blog/public/tags/${encodeURIComponent(reqSlug)}`)
    const canonical = tag?.slug
    if (canonical && canonical !== reqSlug) {
      return sendRedirect(event, `/tag/${encodeURIComponent(canonical)}`, 301)
    }
  } catch {
    // slug 不存在或后端不可达：不重定向，交由 /tag/[slug] 页面处理空态
  }
})
