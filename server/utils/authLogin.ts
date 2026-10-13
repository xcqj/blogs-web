// 登录提交共用链路（S14 社交登录落地时从 login.post.ts 抽出，password / social 两种 grantType 复用）：
//   api-decrypt 加解密（§2.2）→ POST 后端 /auth/login → envelope 判定 → access_token 种 httpOnly cookie。
// token 只落 httpOnly cookie，绝不回传浏览器；clientId 服务端注入，业务代码不手写认证头（D28 红线）。
//
// ⚠️ 与 login.post.ts / social-callback 的分工：本文件只负责「换 token + 种 cookie」这一段，
//    请求参数装配与错误文案由调用方决定（注册代理 register.post.ts 不适用本文件——它不下发 token）。
import { ENC_HEADER, encryptRequest, decryptResponse } from './apiCrypto'
import { setAuthCookie } from './blog'

export type GrantType = 'password' | 'social'

export interface LoginPayload {
  // password grantType
  username?: string
  password?: string
  code?: string
  uuid?: string
  // social grantType（S14：source + 平台回调的 code/state）
  source?: string
  socialCode?: string
  socialState?: string
  grantType: GrantType
}

/**
 * 向后端 /auth/login 提交登录并种登录 cookie。失败抛 createError（statusMessage 携带后端可读消息）。
 *
 * @param event   Nitro 事件
 * @param payload 登录参数（clientId 由本函数从 runtimeConfig 注入，调用方勿传）
 * @param tag     日志标识（失败降级警告里区分来源，如 auth/login、auth/social-callback）
 */
export async function submitLogin(event: any, payload: LoginPayload, tag: string): Promise<void> {
  const { apiBase, appClientId, rsaPublicKey, rsaPrivateKey } = useRuntimeConfig(event)
  const fullPayload = { ...payload, clientId: appClientId }

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (appClientId) headers.clientid = appClientId

  let body: string
  let encrypted = false
  if (rsaPublicKey) {
    // 加密请求：body 为 AES base64 串，encrypt-key 头为 RSA(base64(aesKey))
    const enc = encryptRequest(fullPayload, rsaPublicKey)
    body = enc.body
    headers[ENC_HEADER] = enc.encryptKey
    encrypted = true
  } else {
    // 未配密钥 → 降级明文：后端开着 api-decrypt 时会被拒（表现为“没有访问权限”），
    // 这是环境配置问题，服务端留一条明确警告便于定位
    console.warn(`[${tag}] 未配置 runtimeConfig.rsaPublicKey（NUXT_RSA_PUBLIC_KEY），已降级明文提交；后端开启 api-decrypt 时将登录失败`)
    body = JSON.stringify(fullPayload)
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
    // 未加密且被后端拒 → 多半是忘注入密钥（如直接 node .output 而未加载 .env），给出可定位的提示
    if (!encrypted && json.code === 403) {
      throw createError({
        statusCode: 500,
        statusMessage: '登录失败：后端已开启接口加密但未配置 NUXT_RSA_PUBLIC_KEY（请用 npm start 启动以加载 .env）'
      })
    }
    // 携带后端可读消息（验证码错误/失效、授权类型不支持等）供前端提示
    throw createError({ statusCode: json.code === 401 ? 401 : 500, statusMessage: json.msg || '登录失败' })
  }

  const expireIn = Number(json.data.expire_in || 0)
  setAuthCookie(event, json.data.access_token, expireIn || 60 * 60 * 12)
}
