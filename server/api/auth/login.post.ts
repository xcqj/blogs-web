// 登录代理：POST /api/auth/login → 后端 /auth/login（D28：cookie + Nitro 代理；§2.2 api-decrypt 加密链路）
// clientId/grantType 服务端注入；后端开启 api-decrypt 且 /auth/login 带 @ApiEncrypt，故请求体需 AES+RSA 加密，
// 响应同理加密，用前端解密私钥还原。access_token 只写 httpOnly cookie，绝不回传浏览器。
export default defineEventHandler(async (event) => {
  const { apiBase, appClientId, rsaPublicKey, rsaPrivateKey } = useRuntimeConfig(event)
  const { username, password, code, uuid } = await readBody<{
    username?: string
    password?: string
    code?: string
    uuid?: string
  }>(event)

  const payload = { username, password, code, uuid, clientId: appClientId, grantType: 'password' }

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (appClientId) headers.clientid = appClientId

  let body: string
  let encrypted = false
  if (rsaPublicKey) {
    // 加密请求：body 为 AES base64 串，encrypt-key 头为 RSA(base64(aesKey))
    const enc = encryptRequest(payload, rsaPublicKey)
    body = enc.body
    headers[ENC_HEADER] = enc.encryptKey
    encrypted = true
  } else {
    // 未配密钥 → 降级明文（后端若开启加密会拒绝，属环境配置问题，非代码问题）
    body = JSON.stringify(payload)
  }

  // 以文本取原始响应，避免加密响应被 JSON 解析破坏
  const res = await $fetch.raw<string>(`${apiBase}/auth/login`, {
    method: 'POST',
    headers,
    body,
    responseType: 'text',
    retry: 0
  })

  const raw = typeof res._data === 'string' ? res._data : JSON.stringify(res._data)
  const respKey = res.headers.get(ENC_HEADER)
  let json: { code: number; msg: string; data: any }
  try {
    const plain = encrypted && respKey && rsaPrivateKey ? decryptResponse(raw, respKey, rsaPrivateKey) : raw
    json = JSON.parse(plain)
  } catch {
    throw createError({ statusCode: 502, statusMessage: '登录响应解析失败（加密链路未对齐）' })
  }

  if (json.code !== 200 || !json.data?.access_token) {
    // 携带后端可读消息（验证码错误/失效等）供前端提示
    throw createError({ statusCode: json.code === 401 ? 401 : 500, statusMessage: json.msg || '登录失败' })
  }

  const expireIn = Number(json.data.expire_in || 0)
  setAuthCookie(event, json.data.access_token, expireIn || 60 * 60 * 12)

  return { logged: true }
})
