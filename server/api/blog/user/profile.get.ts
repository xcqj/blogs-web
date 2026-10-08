// §8.1 我的博客资料：GET /api/blog/user/profile → 后端 /blog/user/profile
// 返回 { userId, nickName, avatar, avatarUrl, bio }；头像昵称实时取自 sys_user，不复制到博客表。
export default defineEventHandler(async (event) => {
  return blogAuthedFetch(event, '/blog/user/profile');
});
