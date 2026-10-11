// §7.5 公共标签列表代理：GET /api/blog/public/tags?keyword=&pageNum=&pageSize= → 后端 /blog/public/tags
// 只返回 ACTIVE 且未删标签；供前台「标签」页与联想使用。
export default defineEventHandler(async (event) => {
  return blogGet<{ rows: any[]; total: number }>(event, '/blog/public/tags', getQuery(event))
})
