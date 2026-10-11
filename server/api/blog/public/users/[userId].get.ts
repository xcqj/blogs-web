// §9.1 公共用户资料代理：GET /api/blog/public/users/:userId → 后端 /blog/public/users/{userId}
// 返回 { userId, nickName, avatar, avatarUrl, bio }（头像昵称实时取自 sys_user，不复制）。
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  return blogGet(event, `/blog/public/users/${userId}`)
})
