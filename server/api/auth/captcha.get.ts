// 验证码代理：GET /api/auth/captcha → 后端 /auth/code（公开、未加密，返回 { captchaEnabled, uuid, img }）
// 供 LoginModal 展示验证码图；登录时把 code + uuid 一起提交给 login 代理。
export default defineEventHandler(async (event) => {
  const { apiBase } = useRuntimeConfig(event)
  return $fetch<{ code: number; msg: string; data: any }>(`${apiBase}/auth/code`, { method: 'GET' })
    .then((r) => r.data)
    .catch(() => ({ captchaEnabled: false, uuid: '', img: '' }))
})
