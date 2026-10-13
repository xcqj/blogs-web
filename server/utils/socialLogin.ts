// 社交登录服务端共用常量与 return 跳转 cookie（S14 / D34）。
// 白名单与后端 justauth 配置严格对齐：只接 GitHub / Gitee；微信/QQ/钉钉因企业资质门槛不接入（D34）。
export const ALLOWED_SOURCES = ['github', 'gitee'] as const
export type SocialSource = (typeof ALLOWED_SOURCES)[number]

/** 授权发起时记录、落地成功后消费的站内回跳路径（httpOnly 短时 cookie） */
export const RETURN_COOKIE = 'blog-web-social-return'
const RETURN_MAX_AGE = 600 // 10 分钟：授权链路再慢也够，超过视为过期回首页

export function isAllowedSource(source: string): source is SocialSource {
  return (ALLOWED_SOURCES as readonly string[]).includes(source)
}

/**
 * 记录回跳路径。仅接受站内相对路径（/开头且非 //），
 * 防 //evil.com 协议相对重定向与 javascript: 等 scheme 开放重定向。
 */
export function setReturnCookie(event: any, returnTo: string) {
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return
  setCookie(event, RETURN_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: RETURN_MAX_AGE,
    path: '/'
  })
}

/** 读取并立即清除回跳路径（一次性语义）；无值或非法时回首页。 */
export function consumeReturnCookie(event: any): string {
  const value = getCookie(event, RETURN_COOKIE)
  deleteCookie(event, RETURN_COOKIE, { path: '/' })
  if (value && value.startsWith('/') && !value.startsWith('//')) return value
  return '/'
}
