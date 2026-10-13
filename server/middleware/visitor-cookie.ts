// 阅读量访客 cookie 中间件（S15 / D35）：每个请求确保响应带上 visitor cookie。
// 背景与必要性见 server/utils/visitor.ts 注释——SSR 内部请求的 Set-Cookie 不冒泡，
// 必须在外层 middleware 种；登录用户走后端 userId 去重，此 cookie 服务匿名去重。
export default defineEventHandler((event) => {
  ensureVisitorCookie(event)
})
