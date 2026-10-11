---
name: nuxt-frontend-coding
description: 在 blog-web（Nuxt 4 SSR 博客前台）中按真实代码风格新增或修改页面、路由、SSR 数据获取（useAsyncData/$fetch）、Nitro server route 代理与 cookie 认证、composable/store、UnoCSS + preset-typography(prose) 样式和薄组件。用于落地 ROADMAP S9 页面清单（首页/分页/文章详情/标签/搜索/用户主页 + 登录/评论弹层），对接 ../RuoYi-Vue-Plus/docs/blog-api.md 的公共与登录读者两层接口。触发后应先读取适用 references，再阅读仓库内最近似真实页面与 nuxt.config/uno.config，最后才动模板。禁止调用 /blog/admin/**，禁止裸用浏览器 API（SSR 安全），禁止前端拼接可见性或信任前端传 authorId。
---

# blog-web Nuxt 前台编码规范

blog-web 是纯读者前台（Nuxt 4 SSR）。写代码前先对齐仓库内**已存在的真实页面/组件**与 `nuxt.config.ts`/`uno.config.ts`，再落笔；不要照搬通用 Nuxt 模板，也不要引入组件库。硬性边界以本仓库 `AGENTS.md` 为准，本 skill 只讲实现套路与自检。

## 何时用本 skill

- 新增/修改一个前台页面或路由（内容页 SSR、交互 CSR）
- 接入一条 `/blog/public/**` 或 `/blog/article|user/**` 接口
- 写/改 Nitro server route 代理、cookie 认证、SSR 数据获取
- 用 UnoCSS + `prose` 排版页面、封装薄组件或浏览器 API 安全 composable

## 执行流程

1. 判定任务类型：内容页（SSR）/ 交互层（CSR）/ 只接 API / 只改样式。
2. 先读相关 reference（见“文档读取规则”），不要一次展开全部资料。
3. 阅读目标目录最近似真实代码：已有 `app/pages/*`、`app/components/*`、`app/composables/*`、`server/api/*`。
4. 对照 `../RuoYi-Vue-Plus/docs/blog-api.md` 确认接口路径、出入参、分页字段（`rows`/`total`，参数 `pageNum`/`pageSize`）。
5. 新增页面 = 路由文件 + 数据获取 + 展示组件 + 类型；新增接口调用统一走 Nitro 代理（见下）。
6. 改完按影响范围验证：`npm run build`（含 SSR/nitro 打包，能暴露 SSR 期浏览器 API 误用与类型错），必要时 `npm run dev` 浏览器 + 移动视口验收。

## 文档读取规则

- 页面 / SSR 数据获取 / 组件 / 样式套路：先读 [references/nuxt.md](references/nuxt.md)。
- 认证、Nitro 代理、cookie、alias 301：同读 [references/nuxt.md](references/nuxt.md) 的“认证与 Nitro 代理”“301”小节。
- reference 只约束实现方式；冲突时以仓库真实代码 + `blog-api.md` 契约 + `AGENTS.md` 红线为准。

## 优先级规则

1. blog-web 仓库内最近似页面/组件/composable 的真实写法。
2. `nuxt.config.ts`、`uno.config.ts`、已装模块（Nuxt 原生自动导入优先，不重复造轮子）。
3. 通用 Nuxt 4 / Vue 3 / UnoCSS 官方用法。
4. 其它框架旧惯例（最低，禁止照搬 plus-ui 的 Element Plus / axios 封装写法——前台无组件库、请求走 `$fetch`+Nitro）。

## 不可违反的红线（与 AGENTS.md 同源）

- 只调 `/blog/public/**` 与 `/blog/article|user/**`；**绝不**调 `/blog/admin/**`。
- 不信任前端权限：不拼可见性条件、不传/信 `authorId` 决定归属，一切以后端返回为准。
- SSR 安全：渲染期不裸用 `window`/`document`/`localStorage`/`navigator`；用 `import.meta.client`、`<ClientOnly>` 或客户端 composable 守卫。
- 认证只经 Nitro 代理 + httpOnly cookie；业务代码不手写 `Authorization`/`clientid` 头，token 不落 localStorage。
- 不提交 `.env`（含 `NUXT_APP_CLIENT_ID`）；只提交 `.env.example`。正文 HTML 是后端已净化产物，前台 `v-html` 渲染不再二次清洗、也不假设未净化。

## 目录约定（Nuxt 4）

- `app/` 为 srcDir：`app/pages/`（文件路由）、`app/components/`、`app/composables/`、`app/layouts/`、`app/app.vue`
- `server/`：`server/api/`（Nitro 代理路由）、`server/middleware/`（alias→canonical 301）、`server/utils/`
- 类型放就近 `types.ts` 或 `app/types/`；接口返回类型对齐契约字段名
- 组件/组合式遵循 Nuxt 自动导入（`app/components` 下组件自动可用，composable 自动导入），不手写 import 除非跨约定

## 快速检查清单

- 页面渲染模式下数据是否用 `useAsyncData`（SSR 可读），而非仅 `onMounted` 里 fetch（CSR 才需要）。
- `$fetch` 是否指向本站 Nitro 代理路径（`/api/...`），而非直连后端 `localhost:8081`（避免 CORS 与泄漏后端基址）。
- 分页是否用契约字段 `rows`/`total` + `pageNum`/`pageSize`。
- 是否有裸 `window`/`document`/`localStorage` 出现在会被 SSR 执行的路径。
- 认证相关是否只在 server route 处理 token/cookie，客户端只见登录状态。
- 正文容器是否用了 `prose`（preset-typography）而非自造排版类。
- 移动视口（sm/md 断点）是否可读，无横向溢出。

## 输出要求

- 类型完整，前台数据不多用 `any`。
- 接口路径、字段、分页语义与 `blog-api.md` 一致；冲突先在交付说明里报告。
- 交付前说明运行过的验证命令（`npm run build` / 浏览器视口验收），无法验证时说明原因。

## 推荐提问方式

- 目标页面 + 用到的接口（如“首页对接 §5.1 文章列表 + §7.1 精选 + §7.2 热门标签”）
- 是内容页（SSR）还是交互弹层（CSR）
- 需要参考哪个已有页面 / 组件
- 例如：使用 `$nuxt-frontend-coding` 实现 `/post/{slug}` 文章详情页，对接 §5.2 + §10.1 评论列表，正文用 prose 排版、评论提交用 CSR 弹层。
