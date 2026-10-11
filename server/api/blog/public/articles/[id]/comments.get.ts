// §10.1 公共评论列表代理：GET /api/blog/public/articles/:id/comments → 后端同名接口
// 匿名只读，一级评论，按时间序（后端已排序 + 过滤逻辑删除）。发表属 §10.2（M2）。
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return blogGet(event, `/blog/public/articles/${id}/comments`, getQuery(event))
})
