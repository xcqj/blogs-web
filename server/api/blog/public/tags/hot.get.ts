// §7.2 热门标签代理：GET /api/blog/public/tags/hot → 后端 /blog/public/tags/hot
export default defineEventHandler(async (event) => {
  return blogGet<any[]>(event, '/blog/public/tags/hot', getQuery(event))
})
