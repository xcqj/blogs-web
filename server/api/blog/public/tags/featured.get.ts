// §7.1 精选标签代理：GET /api/blog/public/tags/featured → 后端 /blog/public/tags/featured
export default defineEventHandler(async (event) => {
  return blogGet<any[]>(event, '/blog/public/tags/featured', getQuery(event))
})
