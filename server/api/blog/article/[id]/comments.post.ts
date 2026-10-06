// 发表评论代理：POST /api/blog/article/:id/comments → 后端 /blog/article/:id/comments（§10.2，需登录）
// blogAuthedFetch 从 httpOnly cookie 取 token 注入 Authorization + clientid 头；该端点未加 @ApiEncrypt，明文即可。
// 归属(user_id)/parent_id 全部后端按登录上下文固定，前端不传 authorId（AGENTS.md 红线）。
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const { content } = await readBody<{ content?: string }>(event)
  return blogAuthedFetch(event, `/blog/article/${id}/comments`, { method: 'POST', body: { content } })
})
