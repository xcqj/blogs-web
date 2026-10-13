// §5.2 公共文章详情代理：GET /api/blog/public/articles/:id → 后端 /blog/public/articles/:id
// 阅读量异步计数（S15 / D35）：visitorId 以 query 转发后端，按「登录 userId 优先、匿名 visitorId」
// 做 30min 窗口去重；待增量先落 Redis、10s 批量回写 DB，读路径不再写 DB 行锁。
// 已登录时经服务端读取 session cookie 转发 token（不触浏览器），使用户级去重生效。
// visitor cookie 的种植在 server/middleware/visitor-cookie.ts（外层，Set-Cookie 才能到达浏览器——
// SSR 内部请求种的 cookie 不冒泡，详见 server/utils/visitor.ts 注释）；本路由只读。
// 非公共可见后端返回业务失败 → blogGet 抛错，页面按 404 处理。
// SSR 每次导航取数一次，hydration 复用 payload 不重复计。
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const visitorId = readVisitorId(event)
  // 已登录转发 token：后端 LoginHelper.isLogin() 为真时按 userId 去重（优先于 visitorId）
  const token = getAuthCookie(event)
  return blogGet(
    event,
    `/blog/public/articles/${id}`,
    { visitorId },
    token ? { Authorization: `Bearer ${token}` } : undefined
  )
})
