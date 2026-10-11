// §6 公共搜索代理：GET /api/blog/public/search?keyword=&pageNum=&pageSize= → 后端 /blog/public/search
// 返回 { rows, total }（行结构同 §5.1）。keyword 缺失后端返回业务错误，页面已在前置守卫不空查。
export default defineEventHandler(async (event) => {
  return blogGet<{ rows: any[]; total: number }>(event, '/blog/public/search', getQuery(event))
})
