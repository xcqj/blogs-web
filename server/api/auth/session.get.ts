// 登录态查询：GET /api/auth/session → 供 SSR/客户端判断是否已登录，并带出读者基本信息。
// token 只存于 httpOnly cookie，服务端读取；有 token 时代理 §8.1 GET /blog/user/profile 取昵称头像。
// profile 401（token 过期/无效）时按未登录处理，前端据此清态。
export default defineEventHandler(async (event) => {
  const token = getAuthCookie(event)
  if (!token) {
    return { logged: false, profile: null as null | Record<string, any> }
  }
  try {
    const profile = await blogAuthedFetch<Record<string, any>>(event, '/blog/user/profile')
    return { logged: true, profile }
  } catch {
    clearAuthCookie(event)
    return { logged: false, profile: null as null | Record<string, any> }
  }
})
