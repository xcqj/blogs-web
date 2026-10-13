// Nitro 服务端工具：把对后端的请求收敛到一处，统一注入基址、解 RuoYi envelope。
// 只在 server/ 运行，浏览器不可见（apiBase、appClientId 都是 server-only runtimeConfig）。

/**
 * 后端 GET，自动解包 { code, msg, data } 并返回 data。
 * headers 可选（S15：详情代理转发登录态 token 走用户级阅读量去重；向后兼容，其余代理零改动）。
 */
export async function blogGet<T>(
  event: any,
  path: string,
  query?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  const { apiBase } = useRuntimeConfig(event)
  const res = await $fetch<ApiEnvelope<T>>(`${apiBase}${path}`, {
    method: 'GET',
    query,
    headers
  })
  if (res.code !== 200) {
    throw createError({ statusCode: 502, statusMessage: res.msg || '后端返回异常', data: res })
  }
  return res.data
}

/**
 * 带登录态转发：从本站 httpOnly cookie 取 token，注入 Authorization + clientid 头。
 * 供 /blog/article|user/** 这类需登录的读者接口代理使用。
 */
export async function blogAuthedFetch<T>(
  event: any,
  path: string,
  options: { method?: string; body?: any; query?: Record<string, any> } = {}
): Promise<T> {
  const { apiBase, appClientId } = useRuntimeConfig(event)
  const token = getAuthCookie(event)
  const res = await $fetch<ApiEnvelope<T>>(`${apiBase}${path}`, {
    method: (options.method || 'GET') as any,
    query: options.query,
    body: options.body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(appClientId ? { clientid: appClientId } : {})
    }
  })
  if (res.code !== 200) {
    throw createError({ statusCode: res.code === 401 ? 401 : 502, statusMessage: res.msg || '请求失败', data: res })
  }
  return res.data
}

export const AUTH_COOKIE = 'blog-web-token'

/** 读取（或清除）承载登录态的 httpOnly cookie。 */
export function getAuthCookie(event: any): string | undefined {
  return getCookie(event, AUTH_COOKIE) || undefined
}

export function setAuthCookie(event: any, token: string, maxAgeSeconds: number) {
  // httpOnly：浏览器 JS 读不到；sameSite lax 兼顾顶层导航；生产应配 secure。
  setCookie(event, AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: maxAgeSeconds,
    path: '/'
  })
}

export function clearAuthCookie(event: any) {
  deleteCookie(event, AUTH_COOKIE, { path: '/' })
}

interface ApiEnvelope<T> {
  code: number
  msg: string
  data: T
}
