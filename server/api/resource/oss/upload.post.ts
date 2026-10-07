// 图片/文件上传代理：POST /api/resource/oss/upload → 后端 /resource/oss/upload（契约 §2.4，复用 RuoYi OSS）
// 浏览器只把 file 交给本站 Nitro，token/clientid 由服务端注入；返回 { ossId, url, fileName }。
export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  const file = parts?.find((p) => p.name === 'file' && p.data?.length);
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: '缺少上传文件（字段名需为 file）' });
  }

  const fd = new FormData();
  fd.append(
    'file',
    new Blob([new Uint8Array(file.data)], { type: file.type || 'application/octet-stream' }),
    file.filename || 'upload'
  );
  // 其它表单字段（如 OSS 目录参数）原样透传
  for (const p of parts!) {
    if (p.name && p.name !== 'file' && p.data?.length) fd.append(p.name, p.data.toString());
  }

  return blogAuthedFetch(event, '/resource/oss/upload', { method: 'POST', body: fd });
});
