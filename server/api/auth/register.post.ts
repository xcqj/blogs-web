// 注册代理：POST /api/auth/register → 后端 /auth/register（与登录同走 §2.2 api-decrypt 加密链路）
// clientId/grantType 服务端注入；后端开启 api-decrypt 且 /auth/register 带 @ApiEncrypt，故请求体需 AES+RSA 加密，
// 响应同理加密，用前端解密私钥还原。
//
// 注册即登录（S22 / D35）：后端 `AuthController#register` 注册成功后直接下发 token（R<LoginVo>，
// 参照 S14 socialAutoRegister 口径），本代理按 login.post.ts 同口径把 access_token 种进
// httpOnly cookie——token 绝不回传浏览器。
// ⚠️ 与 /auth/login 仍存在的差异（决定了本文件保留自己的加解密主链而不套用 authLogin.ts）：
//   1. SysRegisterService#register 会校验并**消费**一次图形验证码（RedisUtils.deleteObject，一次性）——
//      这正是「注册后无法就地再调一次 /auth/login」的原因，也是后端改为注册接口本身下发 token 的原因（S22）。
//   2. 客户端/授权类型校验在后端 register 内按 login 同口径完成。
//   3. 兼容旧后端（R<Void> 无 token）：退回只建档，前端保持「注册成功、引导手动登录」旧行为。
// 注册开关由系统参数 `sys.account.registerUser` 控制（ROADMAP §6 D9，S0 脚本已置 true），关闭时后端返回
// R.fail("当前系统没有开启注册功能！")。
export default defineEventHandler(async (event) => {
  const { apiBase, appClientId, rsaPublicKey, rsaPrivateKey } = useRuntimeConfig(event)
  const { username, password, code, uuid } = await readBody<{
    username?: string
    password?: string
    code?: string
    uuid?: string
  }>(event)

  if (!username || !password) {
    throw createError({ statusCode: 400, statusMessage: '用户名和密码必填' })
  }

  // ⚠️ userType 必须显式传 'sys_user'，不能省略：后端 UserType.getUserType(str) 的实现是
  //    StringUtils.contains(str, 枚举值) 逐个匹配，**匹配不到就 throw RuntimeException**，请求落到
  //    全局异常兜底变成「发生未知异常，请联系管理员」，错误信息完全丢失（实测：不传就是这样）。
  //    plus-ui 的 RegisterForm 也是显式带 'sys_user'，这里保持一致。
  const payload = {
    username,
    password,
    userType: 'sys_user',
    code,
    uuid,
    clientId: appClientId,
    grantType: 'password'
  }

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
    // 未配密钥 → 降级明文：后端开着 api-decrypt 时会被拒，服务端留一条明确警告便于定位
    console.warn('[auth/register] 未配置 runtimeConfig.rsaPublicKey（NUXT_RSA_PUBLIC_KEY），已降级明文提交；后端开启 api-decrypt 时将注册失败')
    body = JSON.stringify(payload)
  }

  // 以文本取原始响应，避免加密响应被 JSON 解析破坏
  const res = await $fetch.raw<string>(`${apiBase}/auth/register`, {
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
    throw createError({ statusCode: 502, statusMessage: '注册响应解析失败（加密链路未对齐）' })
  }

  // 成功判 code；注册即登录（S22 / D35）时 data 为 LoginVo（access_token/expire_in/client_id）
  if (json.code !== 200) {
    if (!encrypted && json.code === 403) {
      throw createError({
        statusCode: 500,
        statusMessage: '注册失败：后端已开启接口加密但未配置 NUXT_RSA_PUBLIC_KEY（请用 npm start 启动以加载 .env）'
      })
    }
    // 携带后端可读消息（注册开关未开 / 用户名已存在 / 验证码错误或失效）供前端提示
    throw createError({ statusCode: 500, statusMessage: json.msg || '注册失败' })
  }

  // 注册即登录：按 login.post.ts 同口径种 httpOnly cookie（兼容旧后端 R<Void> 无 token 时跳过）
  if (json.data?.access_token) {
    const expireIn = Number(json.data.expire_in || 0)
    setAuthCookie(event, json.data.access_token, expireIn || 60 * 60 * 12)
    return { registered: true, logged: true }
  }

  return { registered: true }
})
