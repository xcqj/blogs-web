// OSS 批量取址代理：GET /api/resource/oss/listByIds/{ids} → 后端 /resource/oss/listByIds/{ids}
// 用于把正文 HTML 里的 oss://{ossId} 标记解析成真实可访问 URL（照 plus-ui utils/ossContent.ts 的思路）。
// ids 为逗号分隔的 ossId 列表。
export default defineEventHandler(async (event) => {
  const ids = getRouterParam(event, 'ids');
  if (!ids) {
    throw createError({ statusCode: 400, statusMessage: '缺少 ossId' });
  }
  return blogAuthedFetch(event, `/resource/oss/listByIds/${ids}`);
});
