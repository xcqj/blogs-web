# 前端实现清单 · 博客前台 blog-web（S9）

> 派生实现清单，**不是排期/状态权威源**。切片级状态以 `../RuoYi-Vue-Plus/docs/ROADMAP.md`（S9 + §6 D21/D27/D28）为准；本文件只做 blog-web 页面/组件粒度的 TODO 拆解，引用 S9 与契约章节，不复制状态。
> 权威源：API 契约 `../RuoYi-Vue-Plus/docs/blog-api.md`；红线 `AGENTS.md`；编码规范 `.codex/skills/nuxt-frontend-coding/SKILL.md` + `references/nuxt.md`。
> 范围（2026-10-06 定）：**完整 S9 剩余**；D28 附加模块（`@nuxtjs/seo`/`@nuxt/image`/shiki/`@nuxt/eslint`）统一标 `⏸ 按需/MVP 后再定`，只作可选增强，不纳入本轮承诺。

## 0. 正常 Nuxt 流程（本清单的推进模板）

**项目生命周期**：建仓 → `create-nuxt` 初始化 → `nuxt.config`（模块 + runtimeConfig）→ `app/`（srcDir：`pages`/`components`/`composables`/`layouts`/`plugins`）→ `server/`（Nitro：`api`/`middleware`/`utils`）→ 数据获取（SSR `useAsyncData` / CSR 事件）→ `npm run dev` 联调 → `npm run build` → `node .output`（node-server）/ 容器部署。

**单页交付闭环**（每个页面都走这 7 步，一步一自审）：

1. 读目标契约章节，确认接口路径、出入参、分页字段。
2. 建 `server/api/**` 代理（前台浏览器只请求本站 `/api/**`，不直连后端）。
3. 定/补 `app/types` 类型，字段对齐契约。
4. 建 `app/pages` 页面，SSR 用 `useAsyncData` + `$fetch` 走代理。
5. 拆薄组件到 `app/components`（无组件库，UnoCSS 组合类）。
6. UnoCSS + `prose`（preset-typography）排版。
7. 自审（`npm run build` + 浏览器 + 移动视口）→ 小步 commit，信息标 S9。

**渲染模式判据**：需 SEO / 首屏含正文 → SSR（`useAsyncData`）；纯交互（登录、评论提交） → CSR（事件触发 `$fetch` / `<ClientOnly>` 包裹）。

**SSR-safe 铁律**：浏览器 API（`window`/`document`/`localStorage`/`navigator`）只在客户端执行；分页固定 `rows`/`total` + `pageNum`/`pageSize`（契约 §2.1/§2.2）；雪花 ID 后端序列化为字符串，一律当 `string`，不做数值运算。

## 1. 现状（截至 2026-10-06，已交付，勿重复当待办）

| 项 | 状态 |
|---|---|
| Nuxt 4.5.2 脚手架（create-nuxt v4.0.0 `minimal` 模板；官方 v4 starter 无独立 `-t v4` tag，偏差已备案 ROADMAP） | ✅ |
| UnoCSS 66.10.5（按 plus-ui 蓝本裁剪，wind3/attributify/typography/icons + transformers） | ✅ |
| AGENTS.md + `nuxt-frontend-coding` skill（`.codex` 实体 + `.qoder` symlink） | ✅ |
| `server/api/blog/public/{articles,tags/featured,tags/hot}`（§5.1/§7.1/§7.2 代理） | ✅ |
| `server/api/auth/{login,logout,session}`（cookie + clientid 注入骨架） | ✅ 骨架（验证码链路见 §2） |
| `server/middleware/alias-tag-redirect`（§7.3 alias→canonical 301） | ✅ 代码就位（实测见 §2） |
| `server/utils/blog.ts`（统一解 envelope + cookie 读写） | ✅ |
| runtimeConfig `apiBase`/`appClientId` + `.env`(`NUXT_APP_CLIENT_ID`) | ✅ |
| 首页 `/` SSR 真实数据跑通（dev + prod 双验证，9 篇进可见 DOM） | ✅ |
| `/page/[n]`、`/tag/[slug]`（复用 §5.1 代理，含分页/标签过滤） | ✅ |
| `/post/[slug]`、`/search`、`/user/[userId]` | 🟡 路由骨架（数据待接） |
| `LoginModal`（CSR 弹层）、`useAuth`（SSR 读登录态）、`useLoginModal` | ✅ 骨架 |

## 2. 待办（按优先级）

### 2.1 读者核心页

- [ ] `/post/{slug}` 文章详情：§5.2 `GET /blog/public/articles/{articleId}` 代理；字段 `article`/`currentVersion`/`author`/`tags`/`viewCount`；正文用 `prose` 渲染后端**已净化** HTML（前台不二次清洗）；`slug` 为预留字段，MVP 路由承载 `articleId`（契约 §1.4）；阅读量 +1 由后端内建。
- [ ] `/post` 评论列表：§10.1 `GET /blog/public/articles/{articleId}/comments` 代理，一级评论按时间序 SSR 展示。
- [ ] `/post` 发表评论：§10.2 `POST /blog/article/{articleId}/comments`（需登录，走 authed 代理注入 token/clientid；CSR 提交，成功后刷新评论列表；未登录点击唤起 `LoginModal`）。
- [ ] `/search`：§6 `GET /blog/public/search` 代理，`keyword` + 分页；结果复用 `ArticleCard`；空态与参数校验；表单导航到 `/search?keyword=...` 后 SSR 取数。
- [ ] `/user/{userId}`：§9.1 公开资料代理 + §9.2 其公开文章（可复用 §5.1 `authorId` 参数）；用户不存在按列表类语义返回空。

### 2.2 登录 / 认证完整化

- [ ] 验证码链路：对接后端 RuoYi 验证码接口，登录 body 补 `code`/`uuid`，`LoginModal` 增验证码图与刷新。
- [ ] `api-encrypt` 前置检查：确认本地 `api-encrypt.enable` 状态；若开启，`/auth/login` 带 `@ApiEncrypt`，login 代理需实现加密链路（照 plus-ui encrypt 逻辑）或在本地验证阶段临时关闭——列为实现前置检查项，**不默认改动生产安全策略**。
- [ ] `AppHeader` 接 `useAuth`：登录态显示昵称/头像、提供登出入口。

### 2.3 alias 301 实测

- [ ] 造一个 alias 标签（经 plus-ui 治理端 §13 merge/rename 或直接 SQL），验证 `/tag/{aliasSlug}` → 301 → `/tag/{canonicalSlug}`（`server/middleware/alias-tag-redirect` 已就位，仅缺链路实测）。

### 2.4 部署（对应 ROADMAP S9"部署"项）

- [ ] `nuxt.config` 设 `nitro.output: 'node-server'` + blog-web `Dockerfile`。
- [ ] `RuoYi-Vue-Plus/script/docker/docker-compose` 新增 blog-web 服务 + `docs/architecture.md` 部署图同步（后端仓库仅 infra/文档，**零后端代码改动**）。

### 2.5 验收（对应 ROADMAP S9"验收"项，D27/D28）

- [ ] 移动端视口检查：桌面骨架 + UnoCSS 默认断点 sm640/md768 推导，真机无横向溢出（D28 只拍一张桌面骨架，移动/平板由断点规则推导）。
- [ ] SEO 首屏：view-source 含正文与元信息（SSR 生效）。

### 2.6 可选增强（⏸ 按需 / MVP 后再定，不纳入本轮承诺）

- [ ] ⏸ `@nuxtjs/seo`（sitemap/OG/结构化数据，页面已用 `useSeoMeta` 打底）
- [ ] ⏸ `@nuxt/image`（`<NuxtImg>` 封面/头像，需配 `image.domains` 白名单含后端 OSS 域）
- [ ] ⏸ shiki（服务端代码块着色；正文若已由后端存 HTML，不为高亮提前改数据链）
- [ ] ⏸ `@nuxt/eslint`（代码校验，与 plus-ui oxlint 对等时再引入）

## 3. 红线与约定提醒（与 `AGENTS.md` 同源，不在此重复细则）

- 三层 API 边界：只调 `/blog/public/**` + `/blog/article|user/**`，**禁 `/blog/admin/**`**；作者发文/编辑不在前台（D24）。
- 不信任前端 `authorId`/权限；公共可见三条件（`status='1' AND visibility='0' AND del_flag='0'`）由后端过滤。
- token 走 cookie + Nitro 代理，`clientid` 用 `web` 记录，业务代码不手写认证头；`.env` 不入库。
- 无组件库；SSR-safe；构建/校验只在 `blog-web/` 目录内执行；每里程碑小步 commit 标 S9。

## 4. 里程碑推进顺序

```text
M1 阅读闭环：/post 详情(§5.2) + 评论列表(§10.1)
M2 交互与登录：评论发表(§10.2) + 登录验证码链路 + Header 登录态
M3 检索与作者：/search(§6) + /user(§9.1/§9.2)
M4 收口：alias 301 实测 + 部署(node-server/Dockerfile/compose/architecture)
M5 验收：移动视口 + SEO 首屏
```

每个里程碑一次小步 commit；涉及后端仓库的部署项按"零后端代码"边界只做 infra/文档。
