// 阅读量访客标识（S15 / D35）：visitor cookie 的种/读单点。
// 为什么单独抽文件 + middleware 种 cookie：SSR 取数走 Nitro 内部请求
// （useRequestFetch/localCall），**内部响应里种的 Set-Cookie 不会冒泡到外层 HTML 响应**
// （2026-10-14 实测：SSR 文档响应无 set-cookie，直连 API 路由有）——在详情代理里种 cookie
// 浏览器永远收不到，去重永不命中（Chrome 未登录场景全中、Edge 因曾 SPA 导航时被 API 响应
// 种下而侥幸正常，极迷惑）。middleware 在最外层执行，setCookie 直接冒泡到最终响应。
import { randomUUID } from 'node:crypto'

/** 匿名访客标识 cookie：长期有效，阅读量同人窗口去重的身份键（登录用户走后端 userId 优先） */
export const VISITOR_COOKIE = 'blog-web-visitor'
export const VISITOR_MAX_AGE = 365 * 24 * 60 * 60

/**
 * 确保响应带上 visitor cookie：请求未携带时种一个新的。
 * 由 server/middleware/visitor-cookie.ts 对每个请求调用（外层，Set-Cookie 必达浏览器）。
 */
export function ensureVisitorCookie(event: any): void {
  if (!getCookie(event, VISITOR_COOKIE)) {
    setCookie(event, VISITOR_COOKIE, randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: !import.meta.dev,
      maxAge: VISITOR_MAX_AGE,
      path: '/'
    })
  }
}

/**
 * 读 visitorId：cookie 优先（浏览器已存，稳定复用于去重）；
 * 读不到时现场生成一个（首访场景——本次响应已被 middleware 种下 cookie，下次请求即稳定）。
 */
export function readVisitorId(event: any): string {
  return getCookie(event, VISITOR_COOKIE) || randomUUID()
}
