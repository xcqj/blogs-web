# nuxt-frontend-coding reference

blog-web（Nuxt 4 SSR 前台）实现套路细则。冲突时优先级：仓库真实代码 > `../RuoYi-Vue-Plus/docs/blog-api.md` 契约 > `AGENTS.md` 红线 > 本文件。

## 1. 渲染模式与数据获取

- **内容页 SSR**（首页 `/`、`/page/{n}`、`/post/{slug}`、`/tag/{slug}`、`/search`、`/user/{userId}`）：用 `useAsyncData` 在服务端取数，保证 SEO 首屏含正文与元信息。
  ```ts
  // app/pages/index.vue
  const { data } = await useAsyncData('home-articles', () =>
    $fetch('/api/blog/public/articles', { query: { pageNum: 1, pageSize: 10 } })
  )
  ```
- **交互层 CSR**（登录弹层、发表评论）：不进 SSR 数据链，用客户端事件触发 `$fetch`/`await`，或 `<ClientOnly>` 包裹。评论提交后本地刷新列表或重新 `refresh()` 对应 `useAsyncData`。
- 客户端二次刷新用 `refreshNuxtData` / `refresh()`；导航缓存用 `useRoute` 的 key。
- 分页契约：请求 `pageNum`/`pageSize`；响应 `PageResult` 形态 `{ rows, total }`（字段名固定，勿臆造 `records`/`list`）。

## 2. 请求封装：一律走本站 Nitro 代理

前台浏览器**不直连后端** `localhost:8081`。所有对后端的路径都在 `server/api/**` 建一条 Nitro 代理，客户端只请求本站 `/api/**`：
- 好处：规避 CORS、隐藏后端基址、集中注入 `clientid`/转发 cookie。
- 公共匿名接口也统一走代理，保持单一出口。
```ts
// server/api/blog/public/articles.get.ts
export default defineEventHandler(async (event) => {
  const { apiBase } = useRuntimeConfig(event)
  return await $fetch(`${apiBase}/blog/public/articles`, {
    query: getQuery(event)
  })
})
```
- 后端基址来自 `runtimeConfig.apiBase`（`NUXT_API_BASE`，dev 默认 `http://localhost:8081`），不写死在组件里。

## 3. 认证：cookie + Nitro server route 代理（httpOnly）

- 登录经 `server/api/auth/login.post.ts` 代理到后端 `/auth/login`，携带：
  - `clientid` 头 = `runtimeConfig.app.clientId`（即 `NUXT_APP_CLIENT_ID`，`web` 记录）
  - body：`{ username, password, grantType: 'password' }`（+ 验证码字段按后端要求）
- 后端返回的 token 由 **server route 写入 httpOnly cookie**，浏览器 JS 读不到、不落 localStorage；clientid 也在服务端注入，业务代码不手写认证头。
- 后续需要登录的读者接口（如 `POST /blog/article/{id}/comments`）经代理时，server route 从 cookie 取 token 注入 `Authorization` 头转发。
- 登录态在服务端可读（供 SSR 判断是否显示“已登录”），客户端只拿到脱敏状态（如 `useAsyncData` 返回的 profile）。
- 登出：清 cookie + 视需要代理调用后端登出。

## 4. alias → canonical 301（Nitro server middleware）

- 契约 §7.3：命中 alias 时后端返回 canonical；前台的 HTTP 301 由 **Nitro server middleware** 完成（D28，边缘层方案作废）。
- 落在 `server/middleware/tag-redirect.ts`：对 `/tag/{slug}` 先解析（可调 §7.3 `/blog/public/tags/{slug}`），若返回的 slug 与请求 slug 不同（alias 命中）则 `sendRedirect(event, '/tag/'+canonical, 301)`。
- 文章 `slug` 是预留字段、MVP 主路由用 ID（契约 §1.4），故 `/post/{slug}` 实际承载 articleId，别自造按 slug 查文章的逻辑。

## 5. UnoCSS + prose 样式

- 工具类走 `presetWind3`（与 plus-ui 同语法）+ `presetAttributify`；断点用默认 sm640/md768/lg1024/xl1024...（= D28 响应式口径），移动优先时从基础类写、`md:`/`lg:` 覆盖桌面。
- 图标：`presetIcons` + mdi 集合，类形如 `i-mdi:magnify`。只用到的图标会被打包，勿引整库。
- 正文排版：文章详情正文容器用 `class="prose dark:prose-invert max-w-none"`（`presetTypography`），承载后端已净化 HTML（`v-html`）。
- 无组件库：导航、卡片、弹层、分页等写薄组件放 `app/components/`，靠 UnoCSS 类组合，不引入 Element Plus / Naive / Tailwind 本体。

## 6. SSR 安全细则

- 需要浏览器 API 的逻辑封装成只在客户端调用的 composable，或用 `if (import.meta.client)` / `onMounted` 守卫；纯展示用 `<ClientOnly>`。
- 不在 `<script setup>` 顶层执行期读取 `window`/`document`/`localStorage`/`navigator`（这些会在 Nitro 服务端运行时报错）。
- `useCookie` 两端可用（SSR 读的是请求携带的 cookie），适合承载登录态；其余客户端存储不参与 SSR。

## 7. SEO / image / 代码高亮（D28 已列，按需增量接）

- `@nuxtjs/seo`：内容页用 `useSeoMeta`/`useHead` 输出 title、description、OG。
- `@nuxt/image`：封面/头像走 `<NuxtImg>`，域名白名单在 `nuxt.config` 的 `image.domains`/`provider` 配。
- shiki：正文/代码块服务端着色；MVP 阶段若正文已由后端存 HTML，前台着色按需再引，不为高亮提前改动数据链。

## 8. 自检（每次交付前）

- `npm run build` 通过（能暴露 SSR 期误用浏览器 API、类型错、nitro 打包问题）。
- `npm run dev` 打开目标页，移动端视口（Chrome DevTools 或直连 WSL IP `hostname -I`）无横向溢出、内容首屏在 view-source 里可见（SSR 生效）。
- 没有越过 API 边界（grep 确认无 `/blog/admin`）；没有裸 `window`/`document` 进入 SSR 路径。
