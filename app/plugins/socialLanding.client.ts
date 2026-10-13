// 社交登录落地提示（S14）：成功/失败信息由 server/routes/social-callback.get.ts 以 query 带回来
// （token 全程不触浏览器，这里只消费结果标记）。.client 后缀保证 SSR 安全；读一次即清理 query，
// 避免刷新重复弹、也不把失败文案留在地址栏。
export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const router = useRouter()
  const { ok, err } = useToast()

  const hasLogin = route.query.social_login !== undefined
  const hasError = route.query.social_error !== undefined
  if (!hasLogin && !hasError) return

  if (hasError) {
    // err 类 toast 不自动消失（useFeedback 约定：失败信息必须被看见）
    err('社交登录失败', String(route.query.social_error || '请稍后重试'))
  } else {
    ok('登录成功', '欢迎回来')
  }

  // 清理本次落地标记，保留其余 query（分页/过滤等）
  const rest = { ...route.query }
  delete rest.social_login
  delete rest.social_error
  await router.replace({ path: route.path, query: rest })
})
