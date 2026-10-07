/**
 * 作者自助接口统一代理（S12 / D29）：/api/blog/article/** → 后端 /blog/article/**
 *
 * 为什么用「catch-all + 白名单」而不是逐个文件：作者侧有 10 个端点、语义同构（都要注入
 * cookie token + clientid 并解 RuoYi envelope），逐个建文件会重复同样逻辑；白名单又把
 * 可调用面显式锁死，不会变成任意转发。归属与权限仍由后端按 author_id 强制校验（红线）。
 *
 * 边界：这里只允许作者自助层；平台治理 /blog/admin/** 永不代理（AGENTS.md、契约 §15）。
 */
const ALLOW: ReadonlyArray<{ method: string; re: RegExp }> = [
  { method: 'GET', re: /^my$/ }, // §3.2 我的文章列表
  { method: 'POST', re: /^$/ }, // §3.1 创建（草稿）
  { method: 'GET', re: /^[\w-]+$/ }, // §3.3 我的文章详情
  { method: 'PUT', re: /^[\w-]+$/ }, // §3.4 保存（内容变化则建新版本）
  { method: 'DELETE', re: /^[\w-]+$/ }, // §3.8 逻辑删除
  { method: 'POST', re: /^[\w-]+\/(publish|hide|show)$/ }, // §3.5 / §3.6 / §3.7
  { method: 'POST', re: /^[\w-]+\/comments$/ }, // §10.2 发表评论（与专用代理等价）
  { method: 'GET', re: /^[\w-]+\/versions$/ }, // §4.1 版本列表
  { method: 'GET', re: /^[\w-]+\/versions\/[\w-]+$/ } // §4.2 版本快照
];

export default defineEventHandler(async (event) => {
  const method = event.method;
  const rest = getRouterParam(event, 'path') ?? '';
  const target = `/blog/article${rest ? `/${rest}` : ''}`;

  if (!ALLOW.some((a) => a.method === method && a.re.test(rest))) {
    throw createError({ statusCode: 405, statusMessage: `不支持的作者接口：${method} ${rest}` });
  }

  if (method === 'GET') {
    return blogAuthedFetch(event, target, { query: getQuery(event) });
  }
  return blogAuthedFetch(event, target, { method, body: await readBody(event) });
});
