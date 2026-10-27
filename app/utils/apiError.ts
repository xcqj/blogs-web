// 统一提取接口错误文案，避免把 Nitro/Node 的默认状态短语（如 "Bad Gateway"）直接甩给作者。
//
// 背景：代理层 server/utils/blog.ts 把后端 envelope 放进 createError 的 `data`，Nitro 返回的错误体是
//   { statusCode, statusMessage, message, data: { code, msg, data } }
// 而浏览器 fetch 规范下 `Response.statusText` 恒为空串，一旦某条链路没把 statusMessage 透出来，
// 只读 `e.statusMessage` 就会退化成默认短语（实测重复发布已公开文章时显示 "Bad Gateway"，
// 而后端真实消息是「仅草稿状态的文章可以发布」，它藏在 data.data.msg 里）。
//
// 取值顺序：后端原始 msg（最具体）→ 代理 statusMessage → 其它常见字段 → 兜底文案。
// 不用 `e.message`：ofetch 会拼成 "502 Bad Gateway" 这类前缀，对读者/作者没有信息量。
//
// ⚠️ 必须优先读 `e.data.statusMessage` 而不是 `e.statusMessage`：
//   前者是 h3 createError 落进**响应体**的字段；后者是 FetchError 的 **HTTP reason phrase**，
//   代理返回 500 时它恒为 "Internal Server Error"。
//   2026-10-27 实测：登录验证码错误时弹层显示英文 "Internal Server Error"，
//   而后端真实消息「验证码错误」在 e.data.statusMessage 里取不到——就是漏了这一档。
export function apiErrorText(e: any, fallback = '操作失败，请稍后重试'): string {
  return (
    e?.data?.data?.msg ||
    e?.data?.msg ||
    e?.data?.statusMessage ||
    e?.data?.message ||
    e?.statusMessage ||
    fallback
  );
}
