// §8.2 修改我的博客资料：PUT /api/blog/user/profile → 后端 /blog/user/profile
// 只接受 { bio }（≤500）；userId 由后端按登录上下文取，前端不传（契约 §8.2 / 红线）。
export default defineEventHandler(async (event) => {
  const { bio } = await readBody<{ bio?: string }>(event);
  return blogAuthedFetch(event, '/blog/user/profile', { method: 'PUT', body: { bio } });
});
