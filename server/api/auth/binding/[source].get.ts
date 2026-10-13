// 社交登录起点代理（S14 / D34）：GET /api/auth/binding/{source} → 后端 /auth/binding/{source} 取授权 URL。
// source 白名单锁死 github/gitee（与后端 justauth 配置及 socialLogin.ts 严格对齐）。
// 可选 return 查询：授权完成后跳回的站内路径，写 httpOnly 短时 cookie 供落地路由消费（防开放重定向）。
export default defineEventHandler(async (event) => {
  const source = (getRouterParam(event, 'source') || '').toLowerCase()
  if (!isAllowedSource(source)) {
    throw createError({ statusCode: 400, statusMessage: '暂不支持该社交登录方式' })
  }

  // 记录回跳路径（仅站内相对路径；非法值静默忽略，落地时回首页）
  const returnTo = getQuery(event).return
  if (typeof returnTo === 'string') setReturnCookie(event, returnTo)

  const { apiBase } = useRuntimeConfig(event)
  const res = await $fetch<{ code: number; msg: string; data: string }>(`${apiBase}/auth/binding/${source}`, {
    method: 'GET',
    retry: 0
  })
  if (res.code !== 200 || !res.data) {
    throw createError({ statusCode: 502, statusMessage: res.msg || '获取社交登录授权地址失败' })
  }
  return { url: res.data }
})
