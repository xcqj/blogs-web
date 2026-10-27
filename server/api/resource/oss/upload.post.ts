// 图片/文件上传代理：POST /api/resource/oss/upload → 后端 /blog/oss/upload
//
// 2026-10-27（D42）改指向博客域接口：原先转发到 RuoYi 的 /resource/oss/upload，
// 那个接口要 @SaCheckPermission("system:oss:upload")，而注册流程不分配角色（SysRegisterService
// 只建用户不写 sys_user_role），博客用户默认零权限 → 封面与正文插图一律 403
// 「没有访问权限，请联系管理员授权」。博客域接口只要求登录，与契约 §2.4「身份：登录用户」一致。
//
// 浏览器端路径保持 /api/resource/oss/upload 不变（组件无需改动）；
// token/clientid 仍由服务端注入，浏览器拿不到；返回 { ossId, url, originalName }。
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

  return blogAuthedFetch(event, '/blog/oss/upload', { method: 'POST', body: fd });
});
