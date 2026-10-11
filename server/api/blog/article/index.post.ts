// §3.1 创建文章（草稿）：POST /api/blog/article → 后端同名接口。
// 单独建文件而非走 [...path] 代理：Nitro 的 catch-all 不匹配零段路径（/api/blog/article 会 404）。
// 归属 author_id 由后端按登录上下文强制写入，前端不传（红线）。
export default defineEventHandler(async (event) => {
  return blogAuthedFetch(event, '/blog/article', { method: 'POST', body: await readBody(event) });
});
