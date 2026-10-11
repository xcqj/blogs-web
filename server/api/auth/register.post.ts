// 注册代理：POST /api/auth/register → 后端 /auth/register（与登录同走 §2.2 api-decrypt 加密链路）
// clientId/grantType 服务端注入；后端开启 api-decrypt 且 /auth/register 带 @ApiEncrypt，故请求体需 AES+RSA 加密，
// 响应同理加密，用前端解密私钥还原。
//
// ⚠️ 与 /auth/login 的三处差异（决定了本文件不能直接套用 login 的成功判定，务必保持同步更新）：
//   1. 后端 `AuthController#register` 返回 `R<Void>`——**不下发 token**，所以这里只写状态、不建会话。
//   2. `SysRegisterService#register` 会校验并**消费**一次图形验证码（RedisUtils.deleteObject，
//      一次性），同一组 code+uuid 无法再用于登录，故"注册成功即自动登录"在此链路下做不到。
//   3. 因此注册成功≠已登录：前端注册完后必须回到登录再认证一次（与 plus-ui 注册页
//      「注册后将返回登录页继续完成认证」同口径）。
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

  // 成功只能判 code：register 的 data 恒为 null，不存在 access_token
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

  return { registered: true }
})
