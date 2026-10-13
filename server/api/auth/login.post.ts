// 登录代理：POST /api/auth/login → 后端 /auth/login（D28：cookie + Nitro 代理；§2.2 api-decrypt 加密链路）
// clientId/grantType 服务端注入；access_token 只写 httpOnly cookie，绝不回传浏览器。
//
// 加密请求 / 解密响应 / envelope 判定 / 种 cookie 的共用链路已抽到 server/utils/authLogin.ts
// （S14 起社交登录落地路由 server/routes/social-callback.get.ts 同样复用，避免两处加密链路漂移）。
// 本文件只保留 password grantType 的参数装配；register.post.ts 不适用该工具——它不下发 token。
export default defineEventHandler(async (event) => {
  const { username, password, code, uuid } = await readBody<{
    username?: string
    password?: string
    code?: string
    uuid?: string
  }>(event)

  await submitLogin(
    event,
    { username, password, code, uuid, grantType: 'password' },
    'auth/login'
  )

  return { logged: true }
})
