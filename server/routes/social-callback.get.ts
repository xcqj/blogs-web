// 社交登录落地路由（S14 / D34）：GitHub / Gitee 授权完成后浏览器带着 code/state 回到本站。
//   1. source 来自 redirect-uri 上的 ?source=xxx（平台回调会原样带回），白名单校验；
//   2. 服务端用 code/state 调后端 /auth/login（grantType=social）完成换 token，种 httpOnly cookie；
//   3. 成功 302 回授权前记录的站内路径（return cookie，一次性消费）；
//   4. 失败统一带 ?social_error=<后端可读文案> 跳回，由 app/plugins/socialLanding.client.ts 提示。
// 浏览器全程不接触 token；授权失败 / 平台错误 / 账号停用的消息均取后端原文，不做模糊化。
// 依赖均来自 server/utils/（Nitro 自动导入，同 login.post.ts 惯例）。

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const returnTo = consumeReturnCookie(event)

  const fail = (msg: string) => {
    const sep = returnTo.includes('?') ? '&' : '?'
    // 文案截断，避免后端长消息把 URL 撑爆；完整排查看服务端日志与后端响应
    const safeMsg = String(msg || '社交登录失败').slice(0, 80)
    return sendRedirect(event, `${returnTo}${sep}social_error=${encodeURIComponent(safeMsg)}`)
  }

  // 用户在第三方平台点了拒绝/取消
  if (query.error) {
    return fail(query.error === 'access_denied' ? '你已取消社交登录授权' : `授权失败：${query.error}`)
  }

  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const source = typeof query.source === 'string' ? query.source.toLowerCase() : ''
  if (!code || !state || !isAllowedSource(source)) {
    return fail('社交登录回调参数缺失或来源不受支持')
  }

  try {
    await submitLogin(
      event,
      { source, socialCode: code, socialState: state, grantType: 'social' },
      'auth/social-callback'
    )
  } catch (e: any) {
    // 后端原文优先（授权码失效 / state 不匹配 / 客户端未加 social grant 等），与 apiErrorText 同口径取值
    return fail(e?.data?.data?.msg || e?.statusMessage || '社交登录失败，请稍后重试')
  }

  // 成功：带一个标记让落地插件弹成功提示（query 一次性，插件读后即清理）
  const sep = returnTo.includes('?') ? '&' : '?'
  return sendRedirect(event, `${returnTo}${sep}social_login=1`)
})
