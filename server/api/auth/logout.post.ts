// 登出：POST /api/auth/logout → 清本站 httpOnly cookie（后端 Sa-Token 会话自然过期）。
// MVP 前台仅清本地登录态；如需即时作废后端 token，可在此带 token 代理 /auth/logout。
export default defineEventHandler(async (event) => {
  clearAuthCookie(event)
  return { logged: false }
})
