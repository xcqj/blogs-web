# 前端实现清单 · 博客前台 blog-web（S9）

> 派生实现清单，**不是排期/状态权威源**。切片级状态以 `../RuoYi-Vue-Plus/docs/ROADMAP.md`（S9/S12 + §6 D21/D27/D28/D29）为准；本文件只做 blog-web 页面/组件粒度的 TODO 拆解，引用 S9/S12 与契约章节，不复制状态。
> 权威源：API 契约 `../RuoYi-Vue-Plus/docs/blog-api.md`；红线 `AGENTS.md`；编码规范 `.codex/skills/nuxt-frontend-coding/SKILL.md` + `references/nuxt.md`。
> 范围（2026-10-06 定）：**完整 S9 剩余**（2026-10-07 追加 **S12 作者中心**，D29 修订 D24，见 §2.8）；D28 附加模块（`@nuxtjs/seo`/`@nuxt/image`/shiki/`@nuxt/eslint`）统一标 `⏸ 按需/MVP 后再定`，只作可选增强，不纳入本轮承诺。

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
| `/post/[slug]` | ✅ 详情(§5.2)+评论列表(§10.1)+发表评论(§10.2) 已跑通（M1/M2） |
| `/search`、`/user/[userId]` | ✅ §6 搜索 / §9.1+§9.2 用户页 SSR 已跑通（M3） |
| `LoginModal`（CSR 弹层）、`useAuth`（SSR 读登录态）、`useLoginModal` | ✅ 骨架 |

## 2. 待办（按优先级）

### 2.1 读者核心页

- [x] `/post/{slug}` 文章详情：§5.2 `GET /blog/public/articles/{articleId}` 代理；字段 `article`/`currentVersion`/`author`/`tags`/`viewCount`；正文用 `prose` 渲染后端**已净化** HTML（前台不二次清洗）；`slug` 为预留字段，MVP 路由承载 `articleId`（契约 §1.4）；阅读量 +1 由后端内建。（2026-10-06 prod 验证渲染标题/prose/封面/标签）
- [x] `/post` 评论列表：§10.1 `GET /blog/public/articles/{articleId}/comments` 代理，一级评论按时间序 SSR 展示。（2026-10-06 prod 验证 2 条评论 + userName 渲染；内容 `{{ }}` 转义不 v-html）
- [x] `/post` 发表评论：§10.2 `POST /blog/article/{articleId}/comments`（需登录，走 authed 代理注入 token/clientid；CSR 提交，成功后刷新评论列表；未登录点击唤起 `LoginModal`）。（2026-10-06 M2：`CommentForm` + `server/api/blog/article/[id]/comments.post.ts`；未登录 401 已验）
- [x] `/search`：§6 `GET /blog/public/search` 代理，`keyword` + 分页；结果复用 `ArticleCard`；空态与参数校验；表单导航到 `/search?keyword=...` 后 SSR 取数。（2026-10-06 M3：空关键词不查后端；prod 验 Java 共 1 篇进 SSR）
- [x] `/user/{userId}`：§9.1 公开资料代理 + §9.2 其公开文章（可复用 §5.1 `authorId` 参数）；用户不存在按列表类语义返回空。（2026-10-06 M3：资料卡+文章，prod 验 疯狂的狮子Li/9 篇）

### 2.2 登录 / 认证完整化

- [x] 验证码链路：`server/api/auth/captcha` 代理 `/auth/code`，`LoginModal` 打开时拉图、随 `code`/`uuid` 提交、失败刷新重试。（2026-10-06 M2 已接）
- [x] `api-encrypt` 前置检查：确认本地 `api-decrypt.enabled=true` + `/auth/login` 带 `@ApiEncrypt`（评论等其它接口不加密）。login 代理已实现 AES-256-ECB + RSA/PKCS1 加解密链路（`server/utils/apiCrypto.ts`，密钥走 `.env` `NUXT_RSA_PUBLIC_KEY`/`NUXT_RSA_PRIVATE_KEY`，server-only）。（2026-10-06 直连后端 + 代理均验证：错验证码返回"验证码已失效"=请求被成功解密，非"没有访问权限"）
- [x] `AppHeader` 接 `useAuth`：登录态显示昵称（链到 `/user/{userId}`）、提供退出按钮。（2026-10-06 M2）

### 2.3 alias 301 实测

- [x] 造一个 alias 标签（经 plus-ui 治理端 §13 merge/rename 或直接 SQL），验证 `/tag/{aliasSlug}` → 301 → `/tag/{canonicalSlug}`（`server/middleware/alias-tag-redirect` 已就位，仅缺链路实测）。（2026-10-07 M4 实测通过：库里已有治理期留下的 alias，无需造数据——`js`→`javascript`、`thinkphp`→`php`、`spring-boot`→`java` 均 301 且 Location 正确；中文 canonical 正确百分号编码；canonical 本身 200 无重定向环；跟随后列表正常渲染）

### 2.4 部署（对应 ROADMAP S9"部署"项）

- [x] `nuxt.config` 设 `nitro.output: 'node-server'` + blog-web `Dockerfile`。（2026-10-07 M4：`nitro.preset: 'node-server'`，产物 nitro.json 已确认；多阶段 Dockerfile + `.dockerignore` 排除 .env/node_modules/design；`node .output/server/index.mjs` 可直接跑）
- [x] `RuoYi-Vue-Plus/script/docker/docker-compose` 新增 blog-web 服务 + `docs/architecture.md` 部署图同步（后端仓库仅 infra/文档，**零后端代码改动**）。（2026-10-07 M4：`web` 服务用 `profiles: ["web"]` 门控，默认 `up -d` 仍只三件套（已用 `compose config --services` 双验）；`NUXT_API_BASE` 走 host.docker.internal:8081，密钥经 env 透传不入库）

### 2.5 验收（对应 ROADMAP S9"验收"项，D27/D28）

- [x] 移动端视口检查：桌面骨架 + UnoCSS 默认断点 sm640/md768 推导，真机无横向溢出（D28 只拍一张桌面骨架，移动/平板由断点规则推导）。（2026-10-07 M5 浏览器实测：7 档宽度 360/390/414/640/768/1024/1280 × 6 条路由 = **42 组零真实横向溢出**；断点行为 16 个观测点全部对齐 `design/responsive.html`（汉堡 <768 / 桌面导航 ≥768 / hero 视觉 <768 隐藏 / 正文侧栏 <1024 单列 ≥1024 双栏）；汉堡展开不新增溢出、正文 16px/行高 28px、深色顶栏三元素无重叠且不超视口。附带修正：md 档次要叠层几何超出被裁切的问题，按规则表「md 堆叠缩小」在 <1024 隐藏 `stack--secondary`）
- [x] SEO 首屏：view-source 含正文与元信息（SSR 生效）。（2026-10-07 M5：修复三处真缺陷——`<html>` 无 lang（现 `lang="zh-CN"`）、全站无 og 标签（五页补 ogTitle/ogDescription/ogType：website/article/profile）、tag/search/user 缺 description；搜索页加 `robots=noindex,follow` 防薄页被索引；`theme-color` 随深浅双投。实测各页首屏 HTML 含文章卡片/标题/计数与 `.prose p` 正文，非仅 `__NUXT_DATA__`。sitemap/结构化数据归 ⏸ `@nuxtjs/seo`）

### 2.6 可选增强（⏸ 按需 / MVP 后再定，不纳入本轮承诺）

- [ ] ⏸ `@nuxtjs/seo`（sitemap/OG/结构化数据，页面已用 `useSeoMeta` 打底）
- [ ] ⏸ `@nuxt/image`（`<NuxtImg>` 封面/头像，需配 `image.domains` 白名单含后端 OSS 域）
- [ ] ⏸ shiki（服务端代码块着色；正文若已由后端存 HTML，不为高亮提前改数据链）
- [ ] ⏸ `@nuxt/eslint`（代码校验，与 plus-ui oxlint 对等时再引入）

### 2.7 首页视觉定稿与装饰增强（按"返工成本"分层：桶 A 结构 / 桶 B 装饰）

> 分层原则：**版式结构（桶 A）后补贵 → 尽早按效果图一次定；装饰动效（桶 B）后补便宜 → 独立叠层、MVP 后再加，且不改数据链。**

- [x] 🔔 首页视觉定稿轮（桶A）**设计层已完成**：全套 mockup 与决策见本仓库 `design/` 与 §2.8，无需再向用户索取参考；**落地实现见 §2.9**。此轮属桶 A（MVP 内），设计已定稿不再反复。
- [x] 首页预留 hero / 背景槽位（`<ClientOnly>` 挂载点，结构改动极小，中立不锁版式，为桶 B 铺垫）。
- [ ] ⏸ 桶 B 装饰增强（MVP 后）：three.js 背景 / 视差 / 页转过场 / 滚动微交互等，作为独立客户端叠层组件注入上述槽位；three.js 仅客户端运行、不进 SSR，天然与首屏/SEO 解耦，**注入不改数据获取代码**。

### 2.8 作者中心（S12 / D29，登录态）

> D29 修订 D24：blog-web 增设作者中心，登录用户前台自助管理**自己的**文章，全部走 `/blog/article/**`，**零后端改动**；复用已登录 `web` 会话，无需二次登录。

- [ ] 我的文章列表：`GET /blog/article/my`（status/visibility/keyword + 分页），行内动作 发布/hide/show/delete
- [ ] 新建/编辑页：`POST /blog/article`（草稿）/ `PUT /blog/article/{id}`；**编辑器 WangEditor `@wangeditor-next/editor` + `@wangeditor-next/editor-for-vue` 6.4.1**，`<ClientOnly>` + 按需加载（`ssr:false`），产出 HTML（后端 jsoup 净化），**不上 Markdown**
- [ ] 封面/正文传图：复用 `/resource/oss/upload`（契约 §2.4）+ `oss://` 引用解析（照 plus-ui `src/utils/ossContent.ts`）
- [ ] 发布/隐藏/重新公开/删除：`POST /blog/article/{id}/publish|hide|show`、`DELETE /{id}`（服务端按 author_id 校验）
- [ ] 版本只读（可选）：`GET /blog/article/{id}/versions[/vId]` 嵌详情子视图
- [ ] 边界：禁 `/blog/admin/**`（平台治理仍 plus-ui）；作者中心页 CSR 为主、不进读者首屏/SEO；不信任前端 authorId

依赖：S2–S8 后端接口就绪 + S9 `web` 认证链路就位。

**已锁定决策（2026-10-07 桶A 收口）**：

- 作者中心入口：**登录态才在顶栏显示"作者中心"**，未登录不显示；MVP 不做头像下拉菜单。
- 路由与守卫：作者中心统一走 `/me/**`（如 `/me`、`/me/new`、`/me/[id]/edit`、`/me/profile`），**复用 default 布局**，客户端登录守卫——未登录访问唤起 `LoginModal`（不做后台式 RBAC 动态路由）。
- 移动端：**作者中心桌面优先**，移动端可浏览"我的文章"列表，富文本编辑引导至桌面（MVP 不在小屏做重编辑）。
- 分页：全站列表统一**数字分页**（与 `/page/{n}` 一致），不做无限滚动。
- 编辑器字段：**无 slug、无定时发布**；历史版本**只读可查、不可修改**（对齐 append-only 红线）。
- 视觉基线：全套 mockup 见本仓库 `design/`（`design/README.md` 为索引），S12 落地以此为基准。

### 2.9 桶A 视觉落地（把 `design/` 基线写进真实代码）

> 基线在 `design/`（**参考与规范，非逐像素照抄**，实现纪律见 `AGENTS.md`）；每步一个 commit 标 S9。

- [x] `uno.config.ts` 落 token：`theme.colors` 用 `var(--…)`（青+炭黑深浅两套，源 `design/tokens.css`）、覆盖 `theme.fontSize`、`radius`；主题变量单一来源 `:root[data-theme]`
- [x] 接 `@nuxtjs/color-mode`：默认跟随系统 + 可手动切，cookie 存偏好保 SSR 无闪烁；配 `color-scheme`；主题切换按钮 `<ClientOnly>`
- [x] logo/favicon 接入：`AppHeader` 内联 SVG（双色随主题）替换纯文字品牌；`public/favicon.svg`（内嵌 `prefers-color-scheme`）
- [x] 全站 shell：header（首页/标签/搜索 + **登录态才显示"作者中心"**）/ footer / 容器两档（列表 1080 / 正文 68ch）
- [x] 首页 `home` 按 `design/home.html` 定稿版式（静态 hero；three.js 属桶B 不做，保留 `<ClientOnly>` 槽位）
- [x] 详情页 `article` 正文 prose 版式（限宽 68ch、代码块、meta 条、评论区结构）按 `design/article.html`
- [x] 状态组件：骨架屏 / EmptyState / 错误 / 404（按 `design/states.html`）全站复用一套
- [x] 响应式规则落地（按 `design/responsive.html` 表：<640 汉堡、hero 背景移动端隐藏等）

**桶A 落地实况与偏差（2026-10-07，8 步各一 commit + 1 个验收修复 commit）**：

- 新增两个契约支撑页使导航不成死链：`/tags`（§7.5 标签列表，顶栏「标签」落点）、`/me`（D29 作者中心**入口占位**，功能仍属 S12）。
- **未做并备案**：详情页 TOC 与「上一篇/下一篇」——契约无对应接口且 §2.9 本步未列；桌面正文改为居中（`mx-auto`）替代 TOC 占位。若将来要 TOC/上下篇，需先补后端接口或约定客户端解析。
- 验收修复的两条根因（已进代码，非照抄所致）：① `@unocss/nuxt` 未注入 preflight → 缺 `box-sizing:border-box`，`.sd-wrap` 在 390 视口溢出 40px（全站），已在 `tokens.css` 基础层补重置与链接默认样式归零；② preset-typography 的 `.prose{color:var(--un-prose-body);max-width:65ch}` 后注入覆盖 → 深色正文对比度仅 1.83:1，改用 `.prose.prose` 提特异性，修复后 16.35:1。
- 浏览器复验通过：手机零溢出、汉堡完整、桌面正文左右留白对称、深色/浅色双向 + cookie `sd-color-mode` 首屏无闪烁。
- 表单控件 shortcut 化（2026-10-07，S12 前置）：源 `design/app.css` 的 `.input/.textarea/.field/.hint` 落为 uno shortcut `sd-input`/`sd-textarea`/`sd-field`/`sd-label`/`sd-hint`，`LoginModal`/`CommentForm`/`search`/`tags` 四处已改为引用（原各写一套 class 已清零）。S12 作者中心的标题框/封面/标签 chips/侧栏面板直接复用，不再新增控件写法分叉。字号取 token 阶梯值（input=`text-base` 兼防 iOS 聚焦缩放，textarea=`text-sm`），未引入魔法值。
- ~~⚠️ 待人工复核：深色下标签 chip 3.51:1~~ **已结案（非缺陷）**：静态判定 `.sd-chip{color:var(--accent-strong)}`，深色块 `--accent-strong:#67e8f9`、浅色块才是 `#0e7490`；子代理报的 `rgb(14,116,144)` 正是浅色值，且其记录显示当时 `htmlClass=light`（它自己也在任务4 里点了切换），属采样态错配。深色真实对比度为高值，无需改动；用户浏览器目视如仍偏暗再议。

## 3. 红线与约定提醒（与 `AGENTS.md` 同源，不在此重复细则）

- 三层 API 边界：只调 `/blog/public/**` + `/blog/article|user/**`，**禁 `/blog/admin/**`**；作者自助发文/编辑/隐藏/删除在**作者中心**（D29，走 `/blog/article/**`），平台治理仍仅 plus-ui。
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
M6 作者中心(S12/D29)：我的列表 + WangEditor 发文/编辑 + 发布/隐藏/删除（走 /blog/article/**，零后端改动）
```

每个里程碑一次小步 commit；涉及后端仓库的部署项按"零后端代码"边界只做 infra/文档。
