// §5.2 公共文章详情代理：GET /api/blog/public/articles/:id → 后端 /blog/public/articles/:id
// 打开成功时后端 view_count +1（SSR 每次导航取数一次，hydration 复用 payload 不重复计）。
// 非公共可见后端返回业务失败 → blogGet 抛错，页面按 404 处理。
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return blogGet(event, `/blog/public/articles/${id}`)
})
