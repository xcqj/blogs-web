// S17 robots.txt：由 Nitro route 动态产出（替代原 public/robots.txt 静态文件——
// 静态资源优先级高于 route 且无法注入运行时 siteUrl，故原文件已删除）。
// Sitemap 行必须是绝对地址（协议要求），siteUrl 经 runtimeConfig.public 注入（NUXT_PUBLIC_SITE_URL）。
export default defineEventHandler((event) => {
  const { public: pub } = useRuntimeConfig(event)
  const siteUrl = String(pub.siteUrl || '').replace(/\/+$/, '')

  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return `User-Agent: *
# 作者中心需登录，禁止抓取
Disallow: /me/
# 登录/注册等非内容页
Disallow: /register

Sitemap: ${siteUrl}/sitemap.xml
`
})
