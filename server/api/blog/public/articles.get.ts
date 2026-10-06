// §5.1 公共文章列表代理：GET /api/blog/public/articles → 后端 /blog/public/articles
// 公共可见三条件由后端强制过滤，前台不拼可见性、不传 authorId 决定归属（AGENTS.md 红线）。
export default defineEventHandler(async (event) => {
  return blogGet<{ rows: any[]; total: number }>(event, '/blog/public/articles', getQuery(event))
})
