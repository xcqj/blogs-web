// §5.2 公共文章详情代理：GET /api/blog/public/articles/:id → 后端 /blog/public/articles/:id
// 阅读量异步计数（S15 / D35）：种/读 visitorId httpOnly cookie 并以 query 转发，后端按
// 「登录 userId 优先、匿名 visitorId」做 30min 窗口去重；待增量先落 Redis、10s 批量回写 DB，
// 读路径不再写 DB 行锁。已登录时经服务端读取 session cookie 转发 token（不触浏览器），
// 使用户级去重生效；未登录仅 visitorId。
// 非公共可见后端返回业务失败 → blogGet 抛错，页面按 404 处理。
// SSR 每次导航取数一次，hydration 复用 payload 不重复计。
import { randomUUID } from 'node:crypto'

/** 匿名访客标识 cookie：长期有效，首次访问种下（randomUUID 仅服务端执行，SSR 安全） */
const VISITOR_COOKIE = 'blog-web-visitor'
const VISITOR_MAX_AGE = 365 * 24 * 60 * 60

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  let visitorId = getCookie(event, VISITOR_COOKIE)
  if (!visitorId) {
    visitorId = randomUUID()
    setCookie(event, VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !import.meta.dev,
      maxAge: VISITOR_MAX_AGE,
      path: '/'
    })
  }

  // 已登录转发 token：后端 LoginHelper.isLogin() 为真时按 userId 去重（优先于 visitorId）
  const token = getAuthCookie(event)
  return blogGet(
    event,
    `/blog/public/articles/${id}`,
    { visitorId },
    token ? { Authorization: `Bearer ${token}` } : undefined
  )
})
