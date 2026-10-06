// 登录代理：POST /api/auth/login → 后端 /auth/login（D28：cookie + Nitro 代理）
// clientId/grantType 在服务端注入（client_id 来自 server-only runtimeConfig.appClientId），
// 后端返回的 access_token 只写进 httpOnly cookie，浏览器 JS 读不到、不回传 token。
// 注意：后端 /auth/login 带 @ApiEncrypt；若生产开启 api-encrypt，需在此接入加密链路。
export default defineEventHandler(async (event) => {
  const { apiBase, appClientId } = useRuntimeConfig(event)
  const { username, password, code, uuid } = await readBody<{
    username?: string
    password?: string
    code?: string
    uuid?: string
  }>(event)

  const body = {
    username,
    password,
    code,
    uuid,
    clientId: appClientId,
    grantType: 'password'
  }

  const res = await $fetch<{ code: number; msg: string; data: any }>(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { ...(appClientId ? { clientid: appClientId } : {}) },
    body
  })

  if (res.code !== 200 || !res.data?.access_token) {
    throw createError({ statusCode: res.code === 401 ? 401 : 502, statusMessage: res.msg || '登录失败' })
  }

  const expireIn = Number(res.data.expire_in || 0)
  setAuthCookie(event, res.data.access_token, expireIn || 60 * 60 * 12)

  // 只回脱敏状态，不回 token
  return { logged: true }
})
