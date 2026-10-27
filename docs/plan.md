# 前端实现清单 · 博客前台 blog-web（S9）

> 派生实现清单，**不是排期/状态权威源**。切片级状态以 `../RuoYi-Vue-Plus/docs/ROADMAP.md`（S9/S12 + §6 D21/D27/D28/D29）为准；本文件只做 blog-web 页面/组件粒度的 TODO 拆解，引用 S9/S12 与契约章节，不复制状态。
> 权威源：API 契约 `../RuoYi-Vue-Plus/docs/blog-api.md`；红线 `AGENTS.md`；编码规范 `.codex/skills/nuxt-frontend-coding/SKILL.md` + `references/nuxt.md`。
> 范围（2026-10-06 定）：**完整 S9 剩余**（2026-10-07 追加 **S12 作者中心**，D29 修订 D24，见 §2.8；2026-10-13 追加 **S14 社交登录落地 / S17 PWA+SEO / S20 Lenis** 面试亮点，见 §2.15~§2.17，状态以 ROADMAP v0.4 为准）；D28 附加模块（`@nuxtjs/seo`/`@nuxt/image`/shiki/`@nuxt/eslint`）统一标 `⏸ 按需/MVP 后再定`，只作可选增强，不纳入本轮承诺。

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
  **⚠️ 2026-10-28（S25）起本节描述已变**：新增生产形态 `docker-compose.yml`（7 服务全起）；
  dev 形态默认只起**四个**中间件（多了 es），后端/前台/后台移入 `app` profile；
  `NUXT_API_BASE` 改为容器间服务名 `http://backend:8081`，不再用 `host.docker.internal`。
  详见后端仓 `README.md` 与 `docs/ROADMAP.md` S25。

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

- [x] 我的文章列表：`GET /blog/article/my`（status/visibility/keyword + 分页），行内动作 发布/hide/show/delete（2026-10-08 S12-1：`/me` 5 个状态 tab + pageSize=1 并发取计数 + 数字分页 + 骨架/空/错误态；动作可见性严格按契约状态机与 D13，ADMIN_HIDDEN 编辑禁用仅可删；删除两步确认不用 window.confirm）
- [x] 新建/编辑页：`POST /blog/article`（草稿）/ `PUT /blog/article/{id}`；**编辑器 WangEditor `@wangeditor-next/editor` + `@wangeditor-next/editor-for-vue` 6.4.1**（与 plus-ui 同版本，无格式分叉），`<ClientOnly>` + 路由 `ssr:false` 按需加载（实测 WangEditor 独立 chunk 661KB，不进读者首屏 bundle），产出 HTML（后端 jsoup 净化），**不上 Markdown**；字段按 §2.8 锁定：**无 slug、无定时发布**。（2026-10-08 S12-2：`/me/new` + `/me/{id}/edit` 共用 `ArticleForm`；新建后自动转编辑路由避免重复创建；保存与发布为两个动作）
- [x] 封面/正文传图：经 Nitro 代理（`server/api/resource/oss/upload.post.ts`），前端不碰 token/clientid。
  **2026-10-27（D42）改指向 `/blog/oss/upload`**：原先转发 RuoYi 的 `/resource/oss/upload`，该接口要
  `@SaCheckPermission("system:oss:upload")`，而注册流程不分配角色（`SysRegisterService` 只建用户），
  博客用户默认零权限 → 封面与正文插图一律 403「没有访问权限，请联系管理员授权」。博客域接口只要求登录，
  与契约 §2.4「身份：登录用户」一致。浏览器端路径 `/api/resource/oss/upload` 不变，组件零改动。
  **图片 URL 策略已定（D31，2026-10-08）**：正文与封面均**存后端返回的真实访问 URL**，不写 `oss://{ossId}` 标记。
  依据（均为代码实测）：① `SysOssServiceImpl.matchingUrl()` L324-331 **仅当桶为 PRIVATE(0)** 时才换成 `presignGetUrl(..., Duration.ofSeconds(120))`，即过期时长 **120s 且硬编码**；当前 `sys_oss_config.access_policy` 全为 `1`（枚举 0=PRIVATE/1=PUBLIC_READ_WRITE/2=PUBLIC_READ）→ **不签名、不过期**；② `SdBlogArticleServiceImpl.validateCoverUrl()` L275-278 只允许 `/`、`http(s)://` → **封面字段本就不允许存 oss://**（改标记方案需连后端校验一起改）；③ 解析标记的 `/resource/oss/listByIds` 需登录，匿名读者无法解析（即 S10 备案遗留项）。
  **生产约定制**：桶策略用 **公有读(2) + CDN 域名**（博客图片本就公开），并把当前的 `1 公有读写` 收紧为 `2 公有读`（写入仍走后端 SDK 凭据）。
  **私有桶预案（仅当真要私有存储时启用）**：后端加 `OssContentResolver`（正则 `oss://(\d+)` → `OssService.selectByIds` 回填，约 60~80 行、无表结构/契约变更，基建已就绪：`sd-blog` 已依赖 `ruoyi-api`、`SysOssServiceImpl implements OssService`）**且同时把 120s 有效期配置化调长或改走图片代理**，否则仅把破图率从 100% 降到一两成；需另开后端切片（突破零后端改动边界）。
- [x] 发布 / 隐藏 / 重新公开 / 删除：`POST /blog/article/{id}/publish|hide|show`、`DELETE /{id}`（服务端按 author_id 校验；代理层已实测无 cookie → 401）
- [x] 版本只读：`GET /blog/article/{id}/versions[/vId]` 嵌编辑页子视图（2026-10-08 S12-3：`VersionHistory.vue` 折叠面板 + 快照弹层，标记“当前”版、prose 渲染快照正文；**append-only 红线：不提供恢复入口**；代理走 `[...path].ts` 白名单，无 cookie 实测 401）
- [x] 个人资料：`/me/profile` 走 §8.1/§8.2 `GET/PUT /blog/user/profile`（2026-10-08 S12-3：`server/api/blog/user/profile.{get,put}.ts` + 页面；**仅 bio 可改（≤500）**，头像/昵称只读展示（§9.1 不复制）。
  ⚠️ **与 design/profile.html 的有意偏差**：mockup 里的「更换头像」按钮**未实现**——改头像属 RuoYi 用户中心 `/system/user/**`，超出 blog-web 允许的 API 层（红线：只允 `/blog/public/**` 与 `/blog/article|user/**`），改为文案提示“在用户中心修改”。入口已接进 `/me` 页头与移动抽屉）
- [x] 边界：禁 `/blog/admin/**`（平台治理仍 plus-ui）；作者中心页 CSR 为主、不进读者首屏/SEO（`/me/**` 均 `robots=noindex`）；不信任前端 authorId（代理层只透传，归属后端定）

**S12 代理层两个坑（已修，备案）**：① Nitro 的 `[...path]` catch-all **不匹配零段路径**，`POST /api/blog/article`（创建）会 404，需单独 `index.post.ts`；② 作者侧 10 个端点若逐个建文件会重复同一段 authed 转发，改用 `[...path].ts` + **方法/路径白名单**，既 DRY 又锁死可调用面。

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

### 2.10 界面与交互迭代（S12-ui，2026-10-08，对照掘金）

用户反馈“基本功能大都在，但样式细节与交互挺糟糕”，四个决策点已拍板（均为用户选定，非默认推断）：

- [x] **列表容器：保持卡片风格仅微调**（不改成掘金式流式行）——`sd-card` 边框/圆角/`card-hover` 全部保留；commit `4aae3e6`：缩略图放大到 `w-40 h-28`（160×112，10:7，仍在左侧、窄屏隐藏、无图不预留空位）、摘要截 1 行、标签不再单独占行而是并入元信息行右端。
- [x] **自动封面（A 方案，零后端）**：`app/utils/firstImage.ts` 用 `DOMParser` 取正文首个 `<img src>`，仅接受 `/` 与 `http(s)://`（与后端 `validateCoverUrl` 白名单一致，跳过 `data:`/`blob:`/`oss:`）；`coverUrl` 为空时回填，手动选图优先。commit `0b8554c`。**两条已知语义**：① **存的是快照**——日后删掉正文那张图，封面不会自动消失（可手动改）；② **详情页重复显示同一张图**（2026-10-27 用户实拍发现）——封面被回填成正文首图后，`post/[slug].vue` 的顶部封面与正文首图是同一张，读者会连着看到两次。修复：详情页用 `showCover` 判断「封面地址是否已作为 `<img>` 出现在本篇正文 HTML 里」（纯正则、SSR 安全、URL 元字符已转义），命中则跳过顶部封面；手动选的、正文里没有的封面照常显示。**注意判据是"是否出现在本篇正文"，与"是不是网络 URL"无关**，不会导致所有封面都不显示。
- [x] **发文/编辑页改渐进披露**：commit `ac2f9f1`。主区只留 标题 / 标签 / 正文（单栏 `max-w-4xl`）；摘要、封面（两个可选字段）+ 历史版本收进 `PublishDrawer` 右侧抽屉；顶栏改吸顶操作条（`sticky top-16` 贴 AppHeader 下沿，z-20 低于顶栏 z-40）；新增「从正文生成」摘要与自动封面提示；内容快照比对做未保存提醒（**不做自动保存**，避免误写库）。
  - ❗ **为何标签不能像掘金那样收到发布时再填**：后端 `SdBlogArticleServiceImpl.validateTagCount()`（L572-573）在 `createDraft`(L84) 与 `update`(L124) 都会跑，**草稿也必须 1~6 个标签**，故标签留在写作主区。
- [x] **复验三修正**：commit `5131fa6`。① 摘要截断由 `line-clamp-1` 改 `truncate`（产物 CSS 正确写了 `display:-webkit-box`，但新版 Chromium 已支持标准 `line-clamp`，`getComputedStyle().display` 报 **flow-root**、省略号是否出现随内核漂移），并补 `min-h-7` 预留行高（空 `<p>` 不生成 line box 高度为 0，导致列表实测 151.9/128.8/105 三种行高）；② `PublishDrawer` 补 ESC 关闭 + 背景滚动锁；③ `LoginModal` 同类缺失一并补齐。
- [x] **人工验收反馈三条修正**：commit `61c8eb9`（2026-10-08）。① 抽屉里的「状态：已发布」删除（操作条已有徽标，不重复），只保留抽屉独有的首次发布时间；② **已发布文章不再渲染「发布」按钮**——后端 `ArticleGuards.requirePublishable()`（L78-80）只允许草稿发布，重复调用报「仅草稿状态的文章可以发布」；现在 `isPublished` 只剩主按钮「保存修改」，草稿态才是「存为草稿 + 发布」（隐藏/下线的重新公开仍归 `/me` 列表行）；③ 「发布设置」→「更多」，抽屉标题→「更多设置」。
- [x] **错误文案收口（Bad Gateway 真因）**：新增 `app/utils/apiError.ts`，10 处调用点统一。根因：代理 `createError` 把后端 envelope 放在 `data` 里，而浏览器 fetch 的 `Response.statusText` 规范上恒为空串，只读 `e.statusMessage` 的部分链路会退化成 Node 默认短语（实测 GET 路径能正常带出中文 msg，所以是取值字段选错而非代理写错）。取值顺序：`data.data.msg` → `data.msg` → `statusMessage` → `data.message` → 兜底；**不用 `e.message`**（ofetch 会拼成 `502 Bad Gateway` 这种无信息量前缀）。`app/error.vue` 继续读 `error.statusMessage` 是对的（那里是 Nuxt 错误对象，不是 ofetch 错误）。

**待办（本小节遗留）**：

- [ ] 抽屉与登录弹层**缺焦点圈定（focus trap）与关闭后焦点归还**，键盘 Tab 可跑到背页；下轮补（可抽 `useModalA11y` 共用）。
- [ ] 本轮浏览器复验**未拿到截图**（Browser view 被最小化/遮挡，`visibilityState=hidden`，`scrollTo` 失效），结论均出自同源 iframe 量测与 DOM 核对；需人工目视确认列表观感、吸顶条滚动行为、抽屉动画。
- [ ] 掘金式“自动保存至草稿箱”**未做**（仅未保存提醒），如要真自动保存需先定频控与失败重试策略，避免草稿表版本噪声。

### 2.11 质感打磨轮落地（2026-10-09，L1→L5）

用户三项决策：**圆角 2/4**、**色板 sun-summit 蓝灰黄**、**logo + favicon 同步换色**；另定**不加载 webfont**。
对比稿与基线：`design/polish-compare.html`（Before/After + 三个开关）；现状基线 `design/shots/`（可重生、不入库）。

- [x] **L1 token 层** `a4fa043`：色板换 sun-summit（深色由同色相派生）；分隔线改半透明；圆角 8/12/16/20 → 2/2/4/4；
  字号阶梯重排（base 16→17、display 52→72，body→display 落差 3.25×→4.24×）；新增负字距阶梯
  （原 tokens.css 里 `letter-spacing` 出现 0 次）与 `--e1/e2/e3`、三档时长两条曲线；
  新增角色 `--text-dim`/`--accent-fg`/`--accent-soft`/`--accent-line`/`--cta*`/`--danger-ink`/`--raised`；
  根层补 `[hidden]` 重置（缺 preflight 的第二个后果）、h1~h4 默认字号行高字距、全站 `:focus-visible` 环
- [x] **L2 shortcut 层** `a4fa043`：按钮改「基类 btn + 4 变体 + 3 尺寸」五态齐备（去 glow 与胶囊）；
  `sd-card` 半透边 + `shadow-e1`；`card-hover` 升色阶不依赖 glow；输入框与按钮同族同高 38px；
  新增 `sd-search`/`sd-chip-link`/`sd-thumb`/`sd-elev-1~3`/`sd-scrim`/`sd-h1`/`sd-h2`
- [x] **L3 反馈体系** `83acb6a`：`useToast()`（同 key 去重、上限 3、err 不自动消失、可带 action）
  + `useConfirm()`（Promise 风格阻断确认）+ `useModalA11y()`（ESC/滚动锁/**焦点圈定与归还**）；
  `<AppToaster/>` `<AppConfirmDialog/>` 挂 `app.vue`；收编 LoginModal / PublishDrawer / AuthorArticleRow
  三处各写一套的旧实现；ArticleForm 与 `/me`、`/me/profile` 的页内 notice 全部改 toast。
  实测：同 key 去重后 1 条、连发 6 条上限 3、4.2s 后 ok 全消而 err 仍在
- [x] **L4 逐页** `8bc9552` `3dfc734` `3846857`：侧栏与首张卡片对齐（boundingBox 实测差值 0）；
  无摘要卡片不再预留行高（原 `min-h-7` 造成死白）；hero 主 CTA 改黄；prose 关中文假斜体与自动引号、
  strong 提 700、链接改 `--accent-fg`；标签/搜索页改一体化 `sd-search`；全站 6 页 h1 接入字距 token；
  修一个**只有实拍才能发现的 bug**：浅色下 `--accent-soft` 与 `--bg` 同为 `#e9f2f7`，
  使直接放在页面底上的 chip 背景隐形 → 改 `#dbe8f2`
- [x] **L5 品牌同步**：`public/favicon.svg`、`design/favicon.svg`、`design/logo-duotone.svg` 换色
  （`AppBrand.vue` 本来就走 `--logo-back/front`，随 token 自动跟上）；`theme-color` 由旧底色改为新 `--bg`；
  `design/README.md` 的“青 + 炭黑”改为蓝灰阶 + 黄 CTA 并注明旧值作废；
  `nuxt.config.ts` 取消 `alternate icon` 引用（旧 .ico 是上一代青色位图且本机无光栅化工具）

**遗留与待决**：

- [ ] ⚠️ **`public/favicon.ico` 需手动删除**：`DeleteFile` 对非主工作区根静默失败（已知工具限制），
  文件仍在仓中但已不被引用。若需保留位图兼容，应用图像工具从 `favicon.svg` 重生成后再恢复引用。
- [ ] 作者中心页面（`/me`、`/me/new`、`/me/{id}/edit`、`/me/profile`）需登录后目视：它们靠 shortcut 继承新样式，
  但 Playwright 无登录态拍不到（可用 `SHOT_TOKEN=<blog-web-token>` 拍）
- [ ] 已知数据缺陷（非本轮引入）：旧文章正文含 `oss://` 标记与 `src=""` 空值，详情页报 `ERR_UNKNOWN_URL_SCHEME`，
  使 `shot.mjs` 退出码长期为 1（D31 已定不改后端；可清理测试数据或给检查器加白名单）
- [ ] 掘金的另外两条机制未吸收：大标题 `line-height 1.04` 已做，但**负字距对中文仍保守**（CJK 安全档）；
  若想要更“编辑部”的风，下一档是全站直角（jason.blog 语言）

### 2.12 质感机制吸收（2026-10-10，只吸收机制不改已锁规格）

用户明确规则：**“只允许吸收‘机制’，不允许改‘已锁的规格’”**，并追加 3 个参照模板（deploy / arthur-jones / inflouno）。
产出已落文件：**`design/mechanisms.md`** —— 含 6 个参照站的实测数据（curl 取到的 CSS/JS 统计）、
M1~M17 机制对照表（每条带证据/我们现状/判定/成本）、授权核实结论、分批落地计划。

关键实测结论：三个模板 CSS 里 **`cubic-bezier` 出现 0 次**，但全部加载 `gsap.min.js`
（arthur-jones/inflouno 额外带 `ScrollTrigger` + `SplitText`，inflouno 还带 `lenis` + `three`）
——**质感不在 CSS 曲线，而在进场与滚动联动由 JS 驱动**。
反面教材：inflouno 有 **28 个不同 `border-radius` 值**（正是我们已消灭的“没规矩”）；三站大量 `transition: all`（会动到 layout 属性）。

- [x] **批 1（零依赖、高感知）已完成**：M1 弹层进出场（遮罩 `sd-fade` 淡入 + 面板 `sd-pop-in` 缩放弹出，
  登录弹层与确认框都已接）、M7 路由页面过渡（`<NuxtPage :transition="{ name:'page', mode:'out-in' }">`）、
  M8 骨架→内容交叉淡入（首页与 `/me` 列表，Transition 要单一子节点故包一层 div + `key`）、
  M15 `prefers-reduced-motion` 全站兜底（新增 `app/assets/css/transitions.css` 并注册进 nuxt.config）、
  M9 图片懒加载与宽高占位防 CLS（`ArticleCard` 缩略图加 `width/height/loading=lazy/decoding=async`）。
  实测：弹层 `animationName=sd-pop-in`、路由切换出现 `page-enter-from`、首页 5 张缩略图全带 lazy、
  产物 CSS 含 `prefers-reduced-motion`×4；ESC 关闭与跳转均无控制台报错。
  ⚠️ 过程中两个自犯错误已修：① `app.vue` 注释误写成 `*/` 结尾导致模板未闭合、build 失败；
  ② 首版用嵌套 `<Transition>` 使缩进混乱，改用 CSS 动画更简单（且不对全屏遮罩做缩放，否则露边）。
- [x] **批 2（零依赖、中感知）已完成**：M4 滚动进场 reveal（`v-reveal` + IntersectionObserver，支持
  `v-reveal="90"` 错峰延迟；**隐藏态由 JS 在 mounted 加 class**，禁用 JS 时内容照常可见，不会白屏；
  一次性触发不回退）、M10 详情页阅读进度条（`useReadingProgress()`，`transform: scaleX()` 不靠 width
  避免每帧重排）、M11 顶栏滚动方向感知（`useScrollDirection()`，**CSS 限制为仅 <768 生效**，
  因为作者中心吸顶操作条靠 `top-16` 定位，桌面收起顶栏会在其上方留一条空隙；触底不隐藏）。
  两者均用 rAF 节流 + `passive: true`。
  实测：reveal 3 个元素加类、首屏 1 个已进场；进度条 `scaleX(0)→scaleX(1)`；
  窄屏下滑 `translateY(-68px)` 不透明、上滑恢复 `none`；无控制台报错。
  ⚠️ **踩到一个框架行为**：本项目 Nuxt 4.6 **不会自动注册 `app/directives/` 下的指令**
  （产物 JS 里根本没有 `is-revealed`，说明实现文件未进 bundle），必须写 `app/plugins/reveal-directive.ts`
  显式 `nuxtApp.vueApp.directive('reveal', …)`。已记进记忆，避免下次再撞。
- [ ] **批 3（需拍板）**：M3 Lenis 平滑惯性滚动、M5 hero 轻视差、M6 拉丁/数字逐字进场
- [x] 授权已核：**GSAP 3.13 起 core 与全部插件（含 SplitText/ScrollTrigger）MIT 免费可商用**（Webflow 赞助），
  Lenis 亦 MIT——所以障碍不在授权，而在“要不要为 80% 效果多引 30KB 依赖”；建议先零依赖实现，GSAP 留给桶 B
- ❌ **不吸收**：M16 响应式圆角变量（revoul）——与已锁的 2/2/4 单族圆角直接冲突

### 2.13 首页/列表页模块化中改（2026-10-13，参考 jason.blog + yuanpu 模板）

用户三项决策（澄清轮逐项选定）：**范围=仅首页/列表页**（`index.vue` + `page/[n].vue`）；**力度=中改**（保留双栏骨架、补模块，不做单栏全重构）；**yuanpu 按结构特征落地**（暗色极简 / CSS 网格 / 标签化 / CTA 色块；模板预览是 iframe，拿不到像素级视觉，不要求复刻）。视觉基调跟随 jason.blog：内容优先、精选 + 归档时间线、数字分页。

- [x] **精选文章区** `app/components/FeaturedArticle.vue`：Hero 之下通栏大卡，取 §5.1 列表**首条派生**（契约无精选文章接口、§7.1 featured 仅标签，**零后端改动**）；md+ 双栏（文案 + 8:5 封面，封面链接对辅助技术隐藏、不占 Tab）；摘要 `line-clamp-2`；「阅读全文 →」`btn-cta`。
- [x] **归档分组** `app/utils/archiveGroup.ts`（纯函数 `groupByMonth`）+ `app/components/ArchiveGroup.vue`：按 `publishedAt` 年月分组（`2026 · 10` 组头 + 篇数 + 发丝线），**只对当前页分组、不跨页聚合**；首页排除精选首条后分组，`/page/{n}` 全量分组；组内沿用 `ArticleCard` 行式卡片（保持 2026-10-08 定稿形态，不改流式行）。
- [x] **CTA band** `app/components/CtaBand.vue`：页尾 `--cta` 黄底高对比色块（token 反相用法：`bg-cta` + `text-cta-ink`）；主按钮新增 **`btn-ink` 变体**（墨底黄字，`uno.config.ts` shortcut 族 + `SdButton` variant 同步扩展），次按钮墨描边、hover 反相为墨底黄字；纯静态链接（`/me/new` 走既有 `useRequireAuth` 守卫，不调新接口）。
- [x] **边界与收敛**：全站仅 1 篇且被精选消费时不出空状态，改出「更多文章即将发布。」弱提示；`/page/{n}` 页头 `mb-5`→`mb-6` 归 token 刻度；CTA 文案避开与 Hero 口号重复（「下一篇，从你开始」）。
- [x] **验收**：`npm run build` 全绿；SSR markup 核验（精选/组头/CTA/`btn-ink` 均在首屏 HTML）；playwright 三视口实测（临时脚本，已删；playwright 包 `--no-save` 临时装、已卸）：深/浅主题 CTA band 均 `rgb(255,213,0)`、ink 按钮 `#1a1c1c`/`#ffd500`、桌面 1440 / 移动 390 / `/page/2` 横向溢出均为 **0**、移动端 CTA 按钮纵排。⚠️ 截图中文呈方框系**本机 WSL 未装 CJK 字体**（`fc-list` 0 条）而非站点问题，视觉验收需在用户机器浏览器进行（与 S9/M5 同例）。
- 偏差备案：间距仍走 UnoCSS 默认刻度（取值与 token 刻度对齐：16/24/32/48/64），颜色/字号/阴影/动效全部 token——与仓库现状一致；**tokens.css 本轮零改动**（现有 token 已覆盖新模块需求，无需加档位）。

### 2.14 反馈修正与全站风格统一（2026-10-13，承接 §2.13）

用户三点反馈及处理：

- [x] **CTA band 回暖纸克制风**：整块 `bg-cta` 黄太跳 → 改 `bg-elevated` + `border-strong`，黄色收缩为唯一焦点（`btn-cta` 主按钮，即 --cta 签名用法「主行动按钮黄底黑字」）；同步移除唯一用途消失的 **`btn-ink` 变体**（`uno.config.ts` shortcut + `SdButton` variant，防死代码）。
- [x] **去掉精选文章区**：澄清——该块**并非标签精选驱动**（契约无精选文章接口，§7.1 featured 仅标签），而是取 §5.1 列表首条即**最新文章**，「精选」称号属误导；按用户要求整块移除，`FeaturedArticle.vue` 删除，首页列表恢复展示全部文章（归档分组基数回到全量 10 篇）。
- [x] **读者页面风格统一**：`/tag/{slug}`、`/user/{userId}` 接入归档分组 + CTA band（后者标题由旧式 `uppercase tracking-[1.5px]` 改 `sd-eyebrow`，与全站一致）；`/tags`、`/post/{slug}`（置于 68ch 窄栏之外全宽呈现）接 CTA band；各页头间距归 token 刻度（mb-5→mb-6）、模块间距 space-y-8。**有意不接**：`/search`（瞬时 noindex 工具页）、`/register`（认证流）、`/me/*`（作者工作区，与读者转化语境不符）。
- [x] **验收**：`npm run build` 全绿；SSR 六页抽查（CTA/归档组头均在，首页无 `#featured-title`/「阅读全文」残留）；playwright 实测：六页 CTA band 计算样式均为 `--elevated` 底 + `--border-strong` 边 + `--cta` 按钮（rgb(248,245,238)/22% 边/rgb(255,213,0)），桌面 1440 与移动 390 横向溢出均为 0。
- 视觉备注：深色为项目默认主题，CTA band 在深色下层次更清晰（--elevated #232019 / --bg #14120f）；本机 WSL 无 CJK 字体截图仍为方框，最终视觉以用户机器浏览器为准。

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

## 2.15 S14 社交登录落地（blog-web 侧，2026-10-13 规划）

> 后端改造（`SocialAuthStrategy` 自动注册 / justauth 配置 / web 客户端加 social grant）见 ROADMAP S14/D34；本节只列 blog-web 侧。红线不变：token 走 cookie + Nitro 代理，业务代码不手写认证头；**微信/QQ/钉钉因企业资质不接入**（已评估边界）。

- [x] `LoginModal` 增加 GitHub / Gitee 登录按钮：点击经 `server/api/auth/binding/[source].ts` 代理取授权 URL（`/auth/binding/{source}`）后跳转第三方（2026-10-13 S14：按钮带 mdi 图标 + loading 态，`return=route.fullPath` 记回跳路径；第三方是外部站点必须整页导航）
- [x] Nitro 落地路由 `server/routes/social-callback.get.ts`：收 `code/state`（source 由 redirect-uri 的 `?source=` 带回）→ 调后端 `/auth/login`（grantType=social，clientid=web，复用 `server/utils/authLogin.ts` 加密链路）→ 成功种 httpOnly cookie 并 302 回登录前页面 → 失败带 `?social_error=<后端原文>` 跳回，由 `app/plugins/socialLanding.client.ts` 弹 toast 并清理 query（成功弹 `social_login=1` 同机制）
- [x] 附带重构：`login.post.ts` 的加密/判定/种 cookie 链路抽为 `server/utils/authLogin.ts`（password 与 social 两种 grantType 共用，防两处漂移）；`server/utils/socialLogin.ts` 管 source 白名单 + return cookie（仅站内相对路径，防开放重定向）
- [x] 自测：`npm run build` 绿 + **编译产物抽验**（binding/social-callback/login 三个 chunk 的 import 头逐一核对——纯 build 绿不足为凭，曾漏写 socialLogin.ts 时 esbuild 不报错、产物留裸标识符，运行时会 ReferenceError，故补这条抽验纪律）
- [x] 生产产物实测（`PORT=3001 node --env-file-if-exists=.env .output/server/index.mjs`）：github/gitee 授权 URL 200（client_id 已注入）；`wechat` 等白名单外 source 400；`return=//evil.com` 不种 cookie（开放重定向防护）；合法 `return=/post/abc` 种 `blog-web-social-return` httpOnly cookie（Max-Age=600/SameSite=Lax）
- ⚠️ **dev 模式坑（2026-10-13 实测，必修）**：dev 服务器启动后**新增 `server/utils/` 文件不会刷新自动导入注册表**（`.nuxt/imports.d.ts` 仍是启动时快照，HMR 不补），运行时报 `Xxx is not defined` 500——本次社交登录三件套（authLogin/socialLogin）+ login.post.ts 重构全部中招。**新增/改名 server/utils 文件后必须重启 `npm run dev`**；判断方法：curl 报错体的 `message` 是 `Xxx is not defined` 即此坑，与代码无关
- [ ] 验收（待后端 env 与 web 客户端 social grant 就绪后联调）：新用户首次 GitHub 登录自动建号并进入登录态；二次登录直达已绑定账号；解绑后回本地账号；授权链路无 cookie/token 泄露（DevTools 核验）

**联调期实测发现并修复的两个问题（2026-10-13，commit `870ddd2`/`9c96847`）**：

1. **GitHub `redirect_uri` 精确匹配**：GitHub 对 redirect_uri 做含 query 的**整串精确匹配**，注册的 Authorization callback URL 必须与后端配置完全一致——即需注册为 `http://localhost:3000/social-callback?source=github`（JustAuth 惯例：平台来源放 redirect-uri query，落地路由读 `query.source`）。只注册裸路径会报 "The redirect_uri is not associated with this application"。Gitee 同理（用户已配带 query 的地址，授权成功）。
2. **SSR 登录态丢失（根因修复）**：SSR 阶段全局 `$fetch` 的内部请求**不转发浏览器 Cookie**，`/api/auth/session` 恒返回 `logged:false`（同 cookie 直连该 API 返回 `true`，payload 对比实证）。影响面=所有 SSR 整页加载：社交登录 302 落地、任何刷新、直达 `/me` 全部掉登录态；密码登录走 CSR `refresh()` 一直正常，故 S9/S12 未暴露。修法：`useAuth` + `/me` + `/me/profile` 的登录态 fetch 统一改 `useRequestFetch()`（SSR 转发请求头、客户端退化为普通 fetch）。修复后生产产物实测：带 cookie SSR 首页渲染「作者中心/许愿/退出」、`/me` 出数据。**今后所有 SSR 期需要登录态的 fetch 一律用 useRequestFetch，禁止裸用全局 $fetch**（已写入本条纪律）。

> 已知边界（2026-10-16 用户拍板，ROADMAP D40）：社交账号的**绑定/解绑管理不在 blog-web 提供**（S14 范围 = 登录-only），入口仅 plus-ui「个人资料 → 第三方账号」——普通用户不可达，且社交自动建号账号（随机密码）无法登录 plus-ui。评估三个场景（平台账号丢失致博客账号锁死 / 无法追加第二平台 / 无法解绑）后 MVP 维持现状（PRD 未要求绑定管理，S14-D2 已列为"将来显式功能"）。若后续补齐：最小方案 = 作者中心「账号与登录」小节复用 `GET /system/social/list` + `DELETE /auth/unlock/{socialId}`（两个 Nitro 薄代理、零后端改动，约 0.5d），必须带「若为唯一登录方式，解绑后将无法登录」警示文案。

## 2.16 S17 PWA + SEO 三件套（2026-10-13 规划）

- [x] `@vite-pwa/nuxt` 接入：manifest（名称/图标/主题色随 token）+ Workbox 策略（app shell precache / 文章页 stale-while-revalidate / API network-first）+ 离线回退页；**`/me/**` 与需登录 API 不进 SW 缓存**（红线）；iOS 无 SW 的限制写进 README
- [x] `sitemap.xml`（Nitro route 查公共列表生成，含 lastmod）
- [x] `rss.xml`（RSS 2.0，最新 N 篇公共文章）
- [x] JSON-LD：`/post` 注 `Article` 结构化数据（headline/author/datePublished，在现有 `useSeoMeta` 基线上扩展）
- [x] `robots.txt` 声明 sitemap
- [x] 验收（2026-10-28 完成）：
  - **Lighthouse PWA 分数项作废**——Lighthouse **v12（2024-10）起移除了 PWA 类别**，不再产出该分数；改以「SW 注册 + 离线可读」实测替代。
  - **离线可读 PASS**：SW scope `/`、状态 `activated`；`sd-pages` 缓存命中 `/post/{id}`；`context.setOffline(true)` 后 reload，标题与正文完整（365 字符）。**测法注意**：SW 首次安装只接管后续导航，必须先有一次导航（或 reload）让 `controller` 变 true，再断网——直接首访即断网会误判为失败。
  - **SEO 分数 = 100**（S23 T13 记录，最近三次连跑恒 100，见该条）。
  - **结构化数据 PASS**：详情页 1 个 JSON-LD 块，`@type: Article`，含 `headline` / `author(Person)` / `datePublished` / `dateModified` / `image` / `publisher` / `mainEntityOfPage`；`robots.txt` / `sitemap.xml` / `rss.xml` 均 200。
  - 移动视口：已由 S23 T13 的 44 张截图覆盖（含 390 宽）。
  - **本轮顺带修复**：manifest 的 `theme_color` / `background_color` 仍是 S23 之前的暖黑 `#14120f`（注释写着"取 tokens.css 深色 --bg"），已改 `#131415`——否则 PWA 安装后的启动画面与标题栏用旧色。

**实施结果（2026-10-14，blog-web 仓 2 commit 均标 S17：`1437ad2` SEO / `7237ea1` PWA；零后端改动，ROADMAP §3 状态行属跨仓更新留人工）**：

- **版本兼容**：`@vite-pwa/nuxt@1.1.1`（依赖 vite-plugin-pwa `^1.2.0` → 实际装 1.3.0，peer vite `^3~^8`）与本仓 nuxt 4.6.0 + vite 8.3.3 兼容，无降级；workbox 运行时包 5 个显式装为 devDeps。
- **PWA 架构决策**：选 **injectManifest 手写 `app/sw/sw.ts`** 而非 generateSW——generateSW 的 navigateFallback 是 SPA app-shell 语义（导航一律回退文档），与 SSR 站「文章页 SWR + 离线回退」组合互相遮蔽；手写 SW 使红线逐行可审计。注意 Nuxt 4 的 Vite root 指向 `app/`，模块 `srcDir:'sw'` 即 `app/sw`（曾误放根目录 `sw/`，报 `Cannot resolve entry module app/sw/sw.ts`）。
- **红线实现=白名单**：文档导航 SWR 只匹配 `/`、`/page/`、`/post/`、`/tag/`、`/tags/`、`/user/` 前缀，`/me/**`、`/register`、`/social-callback` 天然不在列；`/api/blog/article|user|auth|resource` 不注册任何规则（静态断言：sw.js 中 `me/`、auth api 字样 0 命中；无 NavigationRoute catch-all）。
- **sitemap 分页方案**（2 万演示数据）：index（`/sitemap.xml`）+ 分块 `/sitemap/{n}.xml`（500/块 → 41 块），服务端 `defineCachedEventHandler` 10min + `Cache-Control`；`lastmod` = publishedAt 转 W3C datetime；演示数据清理后自然收缩为 1 块。
- **robots.txt 静态文件删除**改 Nitro route（静态资源优先级高于 route，且需注入运行时 `siteUrl` 的 Sitemap 绝对行）；`runtimeConfig.public` 新增 `siteUrl`（`NUXT_PUBLIC_SITE_URL`，S13 部署配真实域名）。
- **Nuxt 4 manifest link 需显式挂载**：`<VitePwaManifest />`（app.vue）——模块只注册组件不自动注入 head；SW 注册由模块自带 `pwa.client` 插件（`useRegisterSW immediate`）自动完成，SSR 安全。
- **图标**：本机无 PIL/rsvg/inkscape，`tooling/gen-pwa-icons.mjs` 纯 Node 写 PNG（zlib + IHDR/IDAT/IEND/CRC32 + 圆角矩形 SDF 光栅化 + 4×4 超采样），产出 192/512/maskable-512/apple-180 四张，复刻 favicon 双框品牌标记。
- **自测协议已跑**：`npm run build` 全绿 ×3；curl 七端点（sitemap 索引/分块/越界块、rss、robots、manifest、sw.js、offline.html）全 200；XML 输出 minidom 良构校验；`/post` view-source 抽验 JSON-LD + canonical + og:url；预缓存清单 49 条抽验（offline.html/4 图标/manifest 齐）；grep 静态断言（无 `/blog/admin` 调用、SW 红线、robots 已删）；git diff 自审无越界。
- ⏸ **人工待办**（不代跑）：Lighthouse PWA+SEO 分数（Windows Chrome，localhost:3100 生产构建）→ 填 README 留档表；DevTools 核验 SW 注册与 Cache Storage；Offline 刷新已读文章可读 + 未读回落 offline.html；`/me` 登录态确认无缓存写入；iOS Safari 限制确认；移动视口回归；S13 部署时配 `NUXT_PUBLIC_SITE_URL`；ROADMAP §3 S17 状态行与实施结果更新（跨仓，用户择机）；面试前 `blog_s16_cleanup.sql` 执行后 sitemap 收缩验证（可选）。

**人工验收期修复（2026-10-15，用户首测发现 SW 全部不生效：DevTools redundant、零缓存、断网全失败；无头 Chrome 复现定位，2 个 commit：`9195294` PWA / `0f0a57e` 移动视口）**：

- **根因 1（模块默认 transform 冲突）**：`@vite-pwa/nuxt` 生产默认 `manifestTransforms` 面向「预渲染路由页」把 `.html` 条目按 clean-URL 规则改写——本站唯一 html `offline.html` 被改成 `offline` → 预缓存 404 → SW install 失败被静默丢弃。定位路径：Node 桩求值 sw.js 正常 → Playwright 无头 Chrome（`channel:'chromium'`，headless shell 不支持 SW）复现"注册即消失" → 给 workbox-build 打桩 dump manifestEntries 发现条目已损坏 → 读到模块源码 `createManifestTransform` 实锤。修法：`nuxt.config` 自定义 `manifestTransforms`（保留 `.html` 原 URL + 复刻 `_nuxt/builds` appManifest 的 UUID-json 去 revision 处理）。
- **根因 2（SW 生命周期 API 调用位置）**：顶层直接 `self.skipWaiting()/clientsClaim()` 在 Chrome 下致「ServiceWorker script evaluation failed」，注册同样被静默丢弃（Node 桩求值却正常，极具迷惑性）；二分实验确认。修法：移入 `activate` 事件（规范位置）。
- **根因 3（离线回退匹配）**：`caches.match('/offline.html')` 匹配不到带 `?__WB_REVISION__` 查询串的预缓存键 → 改 `matchPrecache('/offline.html')`。
- **M11 移动视口回归（用户截图发现）**：窄屏顶栏下滑隐藏后，`top-16` 定位的悬浮元素孤悬——阅读进度条经包裹层随顶栏同步上移+淡出（内层 scaleX 与外层位移 transform 分离，避免 transform 冲突）；作者中心编辑器吸顶操作条 `top` 收回 0 贴住视顶。桌面经 `@media (max-width:767px)` 零回归（1440px 实测原样）。验证：390px 滚至 40%，顶栏/进度条同步 `translateY(-4rem)`+淡出，进度 `scaleX(0.754)` 数学正确。
- **修复后全链路复验（无头 Chrome）**：安装→激活→49 条预缓存（offline.html/builds/manifest 齐全）；断网刷新已读文章 200；断网导航未读文章回落 offline.html；断网直开 offline.html 200；`/me` 访问后 `sd-pages` 零泄漏（红线 PASS）。
- **Lighthouse 实侧（2026-10-15，Windows Chrome）**：SEO 100 / Performance 100 / Accessibility 100 / Best Practices 96；**PWA 类别已被 Lighthouse 12.0（2024-05）移除**，可安装性改由 Chrome 安装图标 + DevTools Application 手动核验（Agent 已无头复验，按钮级安装留人工）。
- ⏸ **剩余人工事项**：浏览器安装到桌面按钮级验收；登录态 `/me` 人工复测（Agent 侧已用未登录态验证零泄漏）；iOS Safari 限制确认；S13 配 `NUXT_PUBLIC_SITE_URL`；ROADMAP §3 S17 状态更新（跨仓）；`blog_s16_cleanup.sql` 面试前执行后 sitemap 收缩验证（可选）。

## 2.17 S20 Lenis 平滑滚动（2026-10-15 实施）

> D38 收缩后范围：仅 Lenis；hero 视差 / 逐字进场待定；**不做 three.js、不引 GSAP**。纯表现层，无契约/数据/状态机改动，独立 commit 随时可砍。

- [x] 引入 Lenis（`lenis@1.3.26`，约 33KB dist；官方包名已从 `@studio-freight/lenis` 更名，核实 latest=1.3.26 后安装）+ 与 `useScrollDirection()` / 阅读进度条 / v-reveal 的叠加回归
- [x] `prefers-reduced-motion` 兜底（transitions.css 已有，确认 Lenis 同样尊重）
- [x] 验收：桌面/移动滚动手感人工确认；与页面过渡、PWA 无冲突

实施结果（澄清轮三项决策：全站启用 / 温和默认 / 不初始化+监听切换）：

- [x] `app/plugins/lenis.client.ts`（新增，全局 client-only 插件）：`matchMedia('(prefers-reduced-motion: reduce)')` 门控——偏好匹配**不创建实例**（html 无 lenis class，原生滚动原样回退），并监听 change 实现会话中途切换系统偏好时即时创建/销毁（`destroy()` 连 class 一并移除，撤销干净）。配置 `lerp: 0.1`（官方默认）+ `stopInertiaOnNavigate: true`（点站内链接清零惯性，与 Nuxt scrollBehavior 滚到顶、out-in 路由过渡不打架）；`smoothWheel`/`syncTouch` 取默认（true/false，移动端触摸保持原生跟手）。不 provide 实例（当前无消费方，YAGNI）。
- [x] `app/assets/css/transitions.css`：尾部追加 Lenis 官方推荐配套规则，关键 `.lenis.lenis-smooth { scroll-behavior: auto !important }`——`lenis-smooth` 类仅在平滑滚动期间存在于 html（Lenis className getter 行为），中和 `tokens.css` 的 `html { scroll-behavior: smooth }`，防 Lenis 程序化滚动与 CSS 原生平滑双动画。
- [x] 兼容性调研结论（均不改动）：`useScrollDirection`/`useReadingProgress` 监听原生 scroll 事件（Lenis 驱动真实 scrollY，照常触发）；`v-reveal` 走 IntersectionObserver；全仓无嵌套滚动容器、无 `scrollTo`/`scrollIntoView` 调用；弹层滚动锁用 body `overflow`。
- ⚠️ **坑（本项目 Nuxt 4.6 实测）**：`app/plugins` 下 bare 包的**静态默认导入会被 auto-import transform（unimport）整体剥离**——产物 import 语句消失、`new Lenis(...)` 成自由标识符，运行时报 "Lenis is not defined" 白屏（错误页包裹）。改用**动态 `import('lenis')`** 修复（unimport 不触碰动态导入，且顺带代码分割）；与「directives 不会被自动注册」并列为本仓 Nuxt 4.6 两个 transform 坑。
- 自测：`npm run build` 绿 + 产物抽验（lenis 入 client bundle、server bundle 0 命中、CSS 规则入产物）+ 无头 Chrome 冒烟全 PASS：html.lenis class、wheel 平滑渐进（采样曲线 57→156→271→…→563，lerp  ramp 非瞬跳）、路由跳转滚到顶且 class 仍在、reducedMotion=reduce 下无 class 且原生滚动可用、SW 注册状态下刷新正常、三视口（1440/移动 390/reduce）零 console error / 5xx。
- ✅ **人工验收通过**（2026-10-15，用户 Windows 侧浏览器）：桌面滚轮/触控板手感、移动端真机触摸跟手（syncTouch 关闭 = 原生触摸，Lenis 仅桌面滚轮生效，符合预期）、系统「减少动态效果」偏好切换实测不劫持滚动、PWA 安装态（standalone 窗口）叠加，四项均确认无问题。ROADMAP §3 S20 状态已同步跨仓关闭。

## 2.18 S15 阅读量 Redis 异步计数（blog-web 侧，2026-10-14 实施）

> 后端改造（ViewCountService 两段 Lua / flush / 降级 / 契约 §5.2 语义修订）见 ROADMAP S15 与 D35；本节只列 blog-web 侧。核心收益：详情读路径不再写 DB 行锁，同人 30min 窗口去重。

- [x] `server/utils/blog.ts`：`blogGet` 增可选 `headers` 参数（默认空，向后兼容，其余 19 个代理零改动）
- [x] `server/api/blog/public/articles/[id].get.ts`：种/读 `blog-web-visitor` httpOnly cookie（`node:crypto` `randomUUID()`，maxAge 1 年，secure=!dev/sameSite lax）→ 以 query `visitorId` 转发后端；已登录时经 `getAuthCookie` 读 session cookie 转发 `Authorization` 头（服务端读取不触浏览器），使后端按 userId 去重优先于 visitorId
- [x] 自测：`npm run build` 绿 + 产物抽验（详情代理 chunk 的 `getCookie/setCookie/getAuthCookie/blogGet/randomUUID` 全部正确 import，延续 S14 抽验纪律）
- [x] 联调验收（2026-10-14 人工实测通过）：同一浏览器 30min 内重复打开同一文章，`viewCount` 只 +1；DevTools 确认 `blog-web-visitor` 为 httpOnly 且请求带 `?visitorId=`；换浏览器/清 cookie 后再打开 +1；DB 值在 10s 内追上展示值（`docker exec blog-mysql` 只读 SELECT）；停 Redis 降级演练：codec 故障期间全量请求实际走过降级路径、详情持续 200（等效验证，详见 ROADMAP §3 S15 验收清单）
- ⚠️ 与 S14 同源的两个既有纪律继续适用：① 新增 `server/utils` 文件才需重启 dev（本次只改既有文件，HMR 即生效）；② SSR 期需要登录态的 fetch 用 `useRequestFetch`（本次详情代理是服务端路由、不涉及）

**联调期修复（2026-10-14，SSR cookie 断链·第二现场，commit 见下）**：修复 Redisson codec 陷阱后，「每次刷新阅读量仍 +1」——根因：`/post` 详情页 SSR 取数用全局 `$fetch`，**内部请求不转发浏览器 Cookie**（与 S14 useAuth 同款坑的第二个现场），详情代理因此读不到 visitorId cookie（SSR 每次生成新 UUID，去重永不命中）也读不到 token（登录用户不走 userId 去重）；SPA 内导航是浏览器直连所以一直正常，故只有「刷新/直达」暴露。修复：`/post/[slug].vue` 的文章 useAsyncData 改 `useRequestFetch()`。实证：带 `blog-web-visitor` cookie 打 SSR 页面 → Redis 出现对应 `v{}` 去重键；带 token+visitor → 出现 `u{}` 键（登录 userId 路径）。**纪律补丁：今后任何「SSR 取数 + 下游服务端路由依赖 cookie」的链路，取数侧一律 `useRequestFetch`；服务端路由能种/读 cookie 不代表调用方带得了 cookie（curl 直打代理两种都正常，极具迷惑性）**

## 2.19 质感精修轮（2026-10-15 评审完成；一/二/三轮实施完成，**2026-10-16 用户确认样式暂告一段落**）

> 背景：S20 后用户发起的前台质感提升，非 ROADMAP 排期切片（先例：打磨轮批 1/批 2 记录于本文件 §2.12）。评审由 Impeccable 技能完成；实施由 taste-skill（design-taste-frontend）方法论在新对话完成。

评审过程与结论（2026-10-15）：

- 全站基线截图 44 张（tooling/shot：7 页 × 3 视口 × 2 主题 + 登录弹层/卡片 hover 交互态）落 `design/shots/`，控制台/网络零报错；按专业设计标准逐页评审
- **结论：整体在专业水准之上**——token 纪律严格、交互五态齐备、深浅主题一致、无泛 AI 特征（无紫蓝渐变/发光/万物皆卡片）、对比度有门禁、空态/错误态/骨架屏体系完整；差距集中在「内容站转化点」与「排版微细节」两类
- 设计上下文固化为 **`.impeccable.md`**（本仓根目录，Impeccable/taste-skill 的上下文单一来源：Users / Brand（克制·编辑感·深度）/ Aesthetic（暖纸编辑风 + 反参考清单）/ 5 条设计原则 / 硬边界约束），全部内容提炼自已确认决策（tokens.css 头注、本文件打磨轮记录、ROADMAP D30/D38），后续设计类会话自动生效
- 截图伪影备注（勿当缺陷修）：fullPage 截图中视口外 v-reveal 元素不显现（CTA band「消失」）、fixed 背景长页拼接出现色带

力度决策（用户 2026-10-15 定）：**精修**——允许动间距节奏、字号/字距细节、组件视觉升级、局部布局微调（卡片内结构/meta 行排布/区块留白）；不可动信息架构、页面骨架、交互逻辑与数据流；基础清单之外允许实施方按 taste-skill 标准提增量精修项，逐项经用户确认后实施。

基础清单（7 项）+ 增量项（2 项）——用户 2026-10-15 多选问答**全部确认实施**：

1. ✅ 评论未登录态（详情页）：CommentForm 裸文字链 → EmptyState 母题（说明 + 「去登录」按钮，复用 useLoginModal）
2. ✅ 搜索初始态（/search）：裸文本 → EmptyState 母题 + SSR 精选标签 chips（复用 featured 代理，链到 /tag/{slug}）
3. ✅ 中文标题 `text-wrap: balance`：tokens.css h1–h4 元素规则 + prose.css `.prose p` 补 `text-wrap: pretty`（渐进增强）
4. ✅ 移动端列表卡标题 `line-clamp-2`（sm+ 以 `sm:block sm:truncate` 保持单行）——390px 实测省略号渲染正常
5. ✅ prose 代码块复制按钮：`app/plugins/code-copy.client.ts`（client-only，app:mounted + page:finish 双时机注入，防重复，clipboard + execCommand 兜底）
6. ✅ 评论空态图标 h-24→h-16：EmptyState 增 `icon-class` 插槽属性（默认不变），详情页 68ch 窄栏两处空态传 h-16
7. ✅ （争议项，用户拍板做）顶栏登录按钮 accent 实底→soft 底：新增 `btn-soft` 变体（hover 才升实底），contrast.mjs 18 项重跑全过
8. ✅ 增量 A 页脚设计化收尾：AppFooter 品牌名 + tagline + © 行 + 链接组（保留全部真实链接，补首页）
9. ✅ 增量 B 评论时间截到分钟（slice 前 16 位，SSR 安全手法）

实施记录（5 个小步 commit，均标 polish，只动本仓）：

| commit | 批次 | 文件 |
|---|---|---|
| `07221da` | 统一空态语言（项 1/2/6） | CommentForm / EmptyState / post/[slug] / search.vue |
| `02b8d82` | 中文排版（项 3/4/9） | tokens.css / prose.css / ArticleCard / CommentList |
| `5083feb` | 代码块复制钮（项 5） | plugins/code-copy.client.ts（新）/ prose.css / uno.config.ts |
| `1d6bcba` | 登录按钮降重量（项 7） | uno.config.ts / SdButton / SdRollButton / AppHeader |
| `7c02518` | 页脚收尾（项 8） | AppFooter.vue |

实施期发现并修复的问题（备案）：

- **`block` 工具类覆盖 line-clamp 的 `display:-webkit-box`**：卡片标题最初写成 `block … line-clamp-2 sm:truncate`，实测 `display` 仍是 block、两行截断静默失效；改为 `line-clamp-2 … sm:block sm:truncate`（sm+ 才复位 block），390px 真实字体实测 clientHeight=2 行、省略号正常
- **UnoCSS 扫不到运行时注入的图标类**：默认 include 的 `[jt]sx` 不含裸 `.ts`，插件里 `i-mdi:*` 字面量不生成 CSS（注入出空元素）；曾试放开 `.ts` 扫描，但工具链字符串会被误提取出损坏选择器（`[constructor~=…]`）导致 dev 500——最终改用 `safelist: ['i-mdi:content-copy','i-mdi:check']` 精确声明
- **3000 端口实为生产预览（`npm start`）而非 dev**：`npm run build` 会清掉旧 chunk 令运行中的预览服务 manifest 引用的文件 404/500；每批构建后需重启 3000 才可截图（截图打 3000 的口径不变）

验收（agent 侧，2026-10-15）：

- 每批 `npm run build` 通过；每批全量 44 张冒烟截图（7 页 × 3 视口 × 2 主题 + 交互态）控制台/网络零报错
- 关键行为实测：卡片标题 390px 两行截断 + 省略号（真实字体）；复制钮端到端（注入结构/图标渲染/hover 显形/剪贴板内容精确/1.2s 复位/SPA 导航不重复/SSR 输出无注入结构）；登录钮 soft 变体深浅主题默认态/hover 态计算样式；评论时间无秒级
- before/after 截图：上轮基线已备份至 `/tmp/shots-before-batch1/`（44 张），本轮 after 在 `design/shots/`（均不入库）
- **人工事项（用户侧）**：① Windows 浏览器视觉验收 9 项（重点：搜索初始态 chips 数据为测试标签、登录钮 soft 底观感、页脚收尾）；② 复制钮需在有代码块的真实文章上实测（当前样本文章均无 `<pre>`）；③ 3100 端口旧 preview 与 3000 同样受构建清 chunk 影响，如需保留请重启；④ 跨仓 ROADMAP §6 决策记录待随本轮验收一并登记

- [x] 用户挑选清单项 + 增量项确认（9/9 全做，含争议项 7 拍板）
- [x] 实施 + 验收（taste-skill 方法论；人工视觉验收待用户侧完成）

### 二轮精修（2026-10-16，用户带三张截图反馈 → 4 个 polish commit）

背景：用户 Windows 侧验收一轮后提出三处问题——① 页面底部 CTA band「下一篇，从你开始」太空，问能否加三维倾斜；② 首页 Hero 右侧叠层图形（红框标注）显示不正常；③ 顶栏导航三按钮如何调整。经多选问答确认方向：**CTA 静态补分量（否决动效）／Hero 放大精简 + 极淡指针视差（用户明确选择）／导航 active 短下划线**。

实施记录（4 个小步 commit，均标 polish，只动本仓）：

| commit | 批次 | 文件 |
|---|---|---|
| `999e84b` | LayerStack 母题组件 + Hero 叠层放大精简 | LayerStack.vue（新）/ HeroVisual.vue / index.vue / tokens.css |
| `8a65ab3` | Hero client-only ≤3° 指针视差 | HeroVisual.vue |
| `2f778fe` | CTA band 缩微叠层补静态分量 | CtaBand.vue |
| `19b3d24` | 导航 hover/active 统一 w-4 短下划线 | AppHeader.vue |

- **LayerStack.vue（新）**：品牌母题「错位纵深叠层」收敛为可复用组件（logo/空态/Hero/CTA 四处同族，AGENTS「该封装就封装」）；props 化层数/边长/层距/透明度/副栈，纯 CSS 3D 无 JS，SSR 友好
- **Hero 叠层**：主栈 5 层 / 170px / zStep 30（原 6 层 140px zStep 26），容器 240→320px；副栈 88px 透明度 .3 沿对角线滑出；`--layer-fill` 浅色档 #e8e2d6/#d8cfc0 → #ded4c2/#c8bca8（解决浅色主题叠层打在近白底上近乎隐形，图形对比 ≥3:1 人工核对）；**保持 items-center——曾试 items-end 底基线对齐，实测在左上撕出 87px 空洞（视觉容器比文案块高），回退**
- **指针视差**：onMounted 内挂 window 级 passive pointermove + rAF 节流，映射到 ±3° `--tilt-x/--tilt-y`；双守卫（仅 fine pointer / reduced-motion 完全跳过）；SSR 输出无内联倾斜（实测）
- **CTA band**：h2 与说明之间插入缩微叠层（4 层 / 56px / 光学约 81×72px，对应用户批准的 64–80px 档），全站 6 个复用页一致的收尾签名；黄 CTA 仍是唯一强焦点
- **导航**：active/hover 统一 w-4 短横线（rem 基准 17px 下 = 17px），与 prose h2::before 短线语言呼应
- 验证：每批 npm run build 通过；每批全量 44 张冒烟零报错；元素级几何与计算样式实测（hero 面板 289px、叠层 union 255×230 不裁切、CTA band 415px、视差方向/钳制/reduced-motion、导航 17px/0px）；after 截图备份 `/tmp/shots-after-round2/`
- **人工事项（用户侧）**：① Windows 浏览器视觉验收四项（Hero 叠层新分量/指针视差手感/CTA 收尾签名/导航短线）；② 指针视差需真机确认手感（幅度/滞后），不喜欢可只留静态；③ 浅色叠层 fill 为图形对比，无文字 AA 门禁覆盖，需肉眼终审；④ 跨仓 ROADMAP §6 决策记录仍待登记

- [x] 用户反馈三处问题确认方向（多选问答）
- [x] 实施 + agent 侧验收（4 commit；人工视觉验收待用户侧完成）

### 三轮精修（2026-10-16，用户带四张截图反馈 → 4 个 polish commit）

背景：用户 Windows 侧验收二轮后又提四处——① Hero 叠层「位置还是不对，上面看不到了」（红框）；② 搜索页关键词高亮不明显（红框）；③ 登录框「像二十年前的管理后台」；④ 新建文章页标题不明显（问是配色还是主次）。经多选问答确认：**Q1 选 A（offsetY 下移 + <lg 响应式缩放）/ Q2 选 A（chip 式高亮）/ Q3 选 A only（标签降级）/ Q4 选 A only（placeholder 升色）**。

实施记录（4 个小步 commit，均标 polish）：

| commit | 批次 | 文件 |
|---|---|---|
| `97463bf` | Hero 叠层裁切修复 | LayerStack.vue / HeroVisual.vue |
| `87df1d3` | 搜索 chip 式高亮 | ArticleCard.vue |
| `25881d8` | 表单标签降级 | uno.config.ts（sd-label 全局） |
| `4167c18` | 标题 placeholder 升色 | ArticleForm.vue |

- **Hero 叠层裁切（真 bug，预存于二轮放大后）**：实测叠层 union 顶边超出面板顶边 15px 被 `overflow-hidden` 裁切、底部空 74px、质心偏高；768/820 档更重。根因：3D 投影质心不在容器几何中心（translateZ 高层级向上展开更多），union 236px > 容器 221px。修复：LayerStack 架构升级——layer transform 从内联改为 CSS 变量驱动（`--i` 内联 + `--ls-z`/`--ls-zs` 消费，内联 transform 无法被媒体查询缩放）；新增 `offsetY` 属性（默认 0，CTA 不受影响）；`<lg` 内置 `--ls-ss .72`（尺寸）/`--ls-zs .6`（Z 步进）/`--ls-oss .6`（offset 同步缩放）。实测调参：offsetY 34→44（桌面 clearance 17/37→27/26），加 `--ls-oss` 后 md 档 75/40→58/59；多视口（1920~768）零裁切
- **测量陷阱备案**：副叠层 `<lg` 时 `display:none`，其 layer 的 rect 全为 0，会污染 union 测量（曾得出假 -102px）；裁切实测须只取 `.stack:not(.stack--secondary) .layer`
- **搜索高亮**：`<em>` 原仅换 `--accent-fg` 字色，而深浅主题下 accent-fg 与正文色几乎同色（#e4dbc9/#f4f1ea、#2f2c25/#211e1d），只剩字重差别；改 chip 式（accent-soft 底 + accent-fg 字 + 0.15em padding + radius-sm），与 TagChip 同配色对；对比度门禁重跑 18 项全过（chip 用例深 8.98:1 / 浅 10.80:1）
- **表单标签降级**：`sd-label` 全局 `text-sm font-semibold text-muted` → `text-xs font-normal text-dim`（不动 mb-1.5 字段节奏）。爆炸半径（设计系统单一来源纪律）：LoginModal×3、register×4、CoverField×1、me/profile bio、PublishDrawer 封面；新色对过 AA（dim on surface 深 4.67 / 浅 5.40）
- **标题 placeholder**：`.title-input` 裸 input 的 placeholder 吃 UA 默认半透明色，32px 大字号下淡灰；显式指定 `--text-muted`（6.88:1/7.89:1）
- 验证：每批 npm run build 通过；每批全量 44 张冒烟零报错；实测（hero 多视口 clearance 27/26 与 58/59、em 计算样式、标签 12px/400/dim、产物 CSS 规则确认）；after 截图备份 `/tmp/shots-after-round3/`
- **人工事项（用户侧）**：① Windows 视觉验收四项（Hero 叠层完整可见与均衡/搜索高亮可辨性/登录框标签语言/新建页标题 placeholder——后者需登录态，agent 无 token 未截图）；② me/profile 与 PublishDrawer 的标签降级观感确认（全局改动的连带页面）；③ 跨仓 ROADMAP §6 决策记录仍待登记

- [x] 用户反馈四处问题确认方向（多选问答）
- [x] 实施 + agent 侧验收（4 commit；人工视觉验收待用户侧完成）

### 收尾（用户 2026-10-16 确认：「样式就先改到这里」）

三轮精修 agent 侧全部完成，**样式改动暂告一段落**。累计 **13 个 polish commit + 3 个 docs 登记**（评审留档 `8ce3920` 之外）：

- 一轮（9 项：空态语言/中文排版/复制钮/登录钮 soft/页脚）：`07221da` `02b8d82` `5083feb` `1d6bcba` `7c02518`
- 二轮（4 项：LayerStack 母题/Hero 放大/指针视差/CTA 叠层/导航短线——按批次）：`999e84b` `8a65ab3` `2f778fe` `19b3d24`
- 三轮（4 项：Hero 裁切修复/搜索 chip 高亮/标签降级/标题 placeholder）：`97463bf` `87df1d3` `25881d8` `4167c18`

**遗留人工事项闭环（2026-10-16 用户确认全部完成）**：

1. ✅ Windows 浏览器视觉验收全套：搜索初始态 chips、登录钮 soft 底、页脚收尾、复制钮（真实含代码块文章）、Hero 叠层完整可见与均衡（1440 及常用宽度）、搜索高亮可辨性、登录框标签语言、新建文章页标题 placeholder（登录态）、me/profile 与 PublishDrawer 标签降级连带页
2. ✅ 指针视差真机手感人工确认通过（保留现状，未回退 `8a65ab3`）
3. ✅ 跨仓 ROADMAP §6 决策记录已登记（后端仓库，D39 精修轮验收关闭）
4. ✅ 3100 端口旧 preview 重启（构建清 chunk 的已知行为；3000 已在每轮重启）

## 2.20 S22 注册即登录（blog-web 侧，2026-10-16 实施）

> 后端侧（`AuthController#register` 返回 `R<LoginVo>` + `SysLoginService#registerAutoLogin`）见 ROADMAP §3 S22 / §6 D35；本节只列 blog-web 侧。红线不变：token 只落 httpOnly cookie 由 Nitro 代理种，业务代码不手写认证头。

背景：注册成功后旧流程是「成功态 + 去登录按钮」，用户须再手动登录一次。根因是后端 `R<Void>` 不下发 token 且注册即消费验证码（一次性），前端无法就地补登。用户 2026-10-16 确认改为「注册即登录」，跳转目标为「回来源页」。

- [x] `server/api/auth/register.post.ts`：响应出现 `access_token` 时按 login.post.ts 同口径 `setAuthCookie` 种 httpOnly cookie，返回 `{registered:true, logged:true}`；**兼容旧后端**（`R<Void>` 无 token）时退回 `{registered:true}` 只建档——双栈部署窗口期不会把老后端响应当失败
- [x] `app/pages/register.vue`：删除「去登录」成功态（`done` ref 与对应模板块）；成功改为 toast「欢迎加入，已为你完成登录」+ `navigateTo(returnPath)`；新增 `returnPath` computed：读 `route.query.return`，**仅接受站内相对路径**（`startsWith('/')` 且拒 `//` 开头，防开放重定向），无参/非法回首页
- [x] `app/components/LoginModal.vue`：注册链接改 `:to="{ path: '/register', query: { return: route.fullPath } }"`——从任意页（如 `/post/{slug}`）发起注册，成功后落回该页
- [x] `app/composables/useAuth.ts`：`register()` 成功后 `refresh()` 刷新会话（与 `login()` 一致），文档注释同步
- [x] 自测：`npm run build` 绿 + 编译产物抽验（register.post chunk 含 `setAuthCookie`/`access_token`/`logged: true`、无裸标识符；客户端产物含新 toast 文案、旧「账号创建成功」成功态文案已消失）
- [x] E2E 实测（Agent，2026-10-16）：另起 8082 后端（新代码）+ blog-web 生产实例（3002，`NUXT_API_BASE` 指向 8082；用户原 8081 实例未动），验证码明文经 Redis 读取后提交——六用例全过：① 注册 → `{registered:true,logged:true}` + httpOnly token cookie（JWT 含新 userId）；② `/api/auth/session` → logged:true；③ 带 cookie `/api/blog/user/profile` → 200；④ 无 cookie → 401；⑤ 错误验证码 →「验证码错误」不种 token；⑥ 重复用户名 →「注册账号已存在」不种 token。测试用户 `e2e_reg_20261016` 与临时实例均已清理
- [x] 人工事项：浏览器视觉验收（2026-10-16 用户确认通过）——注册成功 toast 呈现、跳回来源页落地（从文章详情页发起）、移动视口回归

## 2.21 S23 全站视觉改版（方向 C，2026-10-26 立项；P1 进行中）

> 状态权威在 ROADMAP §2/§3 S23 与决策 **D41**（后端仓库），本节只做任务粒度拆解，不复制状态。
> 视觉方案台账（Stitch 项目/屏名/屏 ID/落地映射/不吸收清单）见 `../design/stitch/README.md`。
> 力度定义：**换视觉语言**（非"精修"）——D39 精修口径"不动信息架构/骨架"不适用本轮。

**本轮红线（任何阶段不得违反）**

1. 不动 `server/**` 与 `app/types/**`；接口出入参、字段名、三层 API 边界零变化（公共页只调 `/blog/public/**`）。
2. Stitch 产物只作视觉参考，一律回译为 `tokens.css` 变量 + `uno.config.ts` shortcut，禁止搬运内联样式/px 魔法值。
3. 禁止分类/专栏/话题/归档导航——Category 永久舍弃（AGENTS.md §5）。
4. 改任一公共组件前先 grep 全部复用点（`ArticleCard`/`CtaBand`/`TagChip`/`Sd*`）。
5. 数据一律真值：不编造阅读时长、更新频率、编委会、DOI/ISSN、订阅、评论区等站点没有的东西。

### P1 补屏（Stitch，2026-10-26 首页两版已冻结；不计工时）

- [x] T1 首页**列表行**定稿：文字左三层（标题 18/700 单行截断 → 摘要 14 次级单行截断 → meta 12：作者 · 阅读 · 右端标签）+ **右侧**封面缩略图 132×76（16:9、3px、垂直居中）；图文间距 20px；行上下 padding 16px；行高 **118px**；行间仅 1px 分割线。**方案变更**：原设计为"缩略图 120×80 在左"，2026-10-26 用户对照掘金列表定为右图（左侧图位会让文字起点右移、左边缘不齐，且缺 meta 行导致行内显空）
- [x] T2 首页**头条**定稿：文字左 + 右图 260×146（16:9、3px、垂直居中）；`LATEST` 标签 → 衬线标题 48px（最多两行）→ 摘要两行 → meta；行高约 190px；仅第 1 页生效；无封面时降级为纯文字头条（高度自然收缩）
- [x] T3 深色版首页：底 `#131415` / 面 `#1A1C1F` / 浮 `#232629` / 强调提亮 `#6E9BE0`（原 `#1A4D8F` 深底仅约 2.1:1 不可用）/ 衬线标题 700；已确认无发光、无冷蓝底、强调色可读
- [x] T4 冻结结论：两屏 screen id 与冻结声明入 `design/stitch/README.md` §2；**冻结规格表 §4.1**；**响应式降级规则 §4.2**（五档：≥1280 / 1024–1279 / 768–1023 / 640–767 / <640；原则=只改列数与尺寸档，不改信息层级；容器 1080→1100、测量 68ch→66ch）。已确认**不改的两处**：深色版比浅色短 985 CSS px、浅色版导航缺激活态/hero 高度不同——主题与激活态在代码里由同一套 DOM + 变量决定，不会出现两版
- [x] T23 文章详情页**不抽卡**（2026-10-26 决策）：正文排版语言已由 T24 的编辑器正文区给全——17px/1.75/66ch、代码块（外框 1px + 顶部文件名栏 + 语言标签 + 13px 等宽）、引用块（2px 靛蓝左边线 + 次级色）、行内代码 chip；依据见 `design/stitch/README.md` §5.1，详情页直接按此落地，省一次抽卡
- [x] T24 作者中心「发文/编辑」页屏：已出并冻结（screen `7090da8584514d789da32e23256f169e`，2560×4348）；顶部经一次修正为「站点导航 64px + 页内操作条 56px」两段式（首版站点导航缺失且两条栏内容重复、中英混排）；**已知偏差必须落地剔除**——版本「恢复/差异对比」（版本恢复为 MVP 排除项）、「已自动保存」（本站不做自动保存）、刊期/卷号/CC 协议、伪技术文案，清单见台账 §6；信息结构见本节附「发文/编辑页信息结构」

### P2 立规范（0.5d，代码零改动）

- [x] T5 建 `design/stitch/README.md`：屏台账（3 屏真实 id）+ 落地映射 + **不吸收清单** + **降级规则** + 页面状态表；另加 §0 核心前提（Stitch 页面与本站数据/功能不一一对应）、§4.1 冻结规格表、§4.2 响应式九档、§4.3 token 对照、§5.1 详情页版式依据、跨屏冲突裁决顺序
- [x] T6 更新 `.impeccable.md`（2026-10-27 全量重写）：方向 C 美学定义取代"暖纸编辑风"；六条设计原则（新增"面层级必须差一档"并记录 Stitch 命名撞车）；四条硬约束（字体/阴影/响应式/Stitch 纪律）；末尾「已推翻的旧规则」表
- [x] T7 产出 **token old→new 对照表**（台账 §4.3）：色板 25 项 / 字体字号 15 项 / 圆角间距阴影 / shortcut 增废 / 破坏面 grep 清单，经用户过目后才动 `tokens.css`
- [x] T8 列 `uno.config.ts` shortcut 增废清单（台账 §4.3.4）：实际新增 `sd-serif`/`sd-mark`/`sd-row`/`sd-meta`；`sd-chip` 去胶囊改 3px 小标签；`--cta*` 未删而是重定向到 `--accent`（6 处调用点保留，避免 P3 阶段按钮变透明）

### P3 换地基（1.5~2d，唯一一次全站同时变样）

- [x] T9 `tokens.css` 重建（commit `9183a63`）：冷米白 `#FCF9F8` / 深 `#131415`；靛蓝浅 `#1A4D8F`、深提亮 `#6E9BE0`（原色在近黑上仅约 2.1:1）；圆角全 3px；`--e1~--e3` 归零，仅保留 `--shadow-float`（浮层）与 `--shadow-card`（柔化卡片硬边）两档例外；新增 `--font-serif`；深色 `--accent-ink` 改深字 `#0F1215`（白字仅 2.8:1）；补 `*,*::before,*::after{border-width:0;border-style:solid}` —— **修复 preflight 未注入导致全站 border 从不渲染的长期根因**
- [x] T10 **Noto Serif SC 引入（方案 A，2026-10-26 实测定案）**：`npm i @fontsource/noto-serif-sc`，只 `import '@fontsource/noto-serif-sc/700.css'`——101 个 `unicode-range` 分片（合计 3.1MB，单片 1.5–54KB），浏览器按需下载，**实测典型首屏命中 11 片约 420KB**；`font-display: swap` 由包内 CSS 提供；**不做 preload**（无法预知命中分片）；不采用 1.5MB 全量单文件入口（`chinese-simplified-700.css`）。使用范围收敛到 **H1 级标题**（hero / 文章大标题 / 头条 / 正文 H2），列表行 18px 标题不用衬线（既省流量也更好读）。**验收线由 ≤100KB 修正为 ≤500KB**（100KB 对中文衬线不可达，实测数据见台账 §4.3.2）；禁走 Google Fonts CDN
- [x] T11 `uno.config.ts` 按 T8 清单重建（同 commit `9183a63`）：新增 `sd-serif`/`sd-mark`/`sd-row`/`sd-meta`；`sd-card` 去阴影、`card-hover` 去上浮只加深边框、`sd-chip` 去胶囊、`btn` 高 38→40 且过渡去 `box-shadow`；`fontFamily` 补 `serif` 映射
- [x] T12 `Sd*` 基础件随 shortcut 自动生效（btn 高 40 + 加深描边形态、sd-card 去阴影、sd-chip 去胶囊、sd-input/sd-search 高 40）；**未改组件模板**，只改 tokens + uno，改完 grep 过全部复用点
- [x] T13 **全站回归完成（2026-10-27）**：`contrast.mjs` 由 16 项扩到 **18 项**并重算——换新色板后首跑挂 2 项（深色 meta `#767c84` 仅 4.05:1、浅色 `#8b949e` 仅 3.1:1），修正为 `#8a9099` / `#667080` 后全过；`shot.mjs` **44 张退出码 0、无 console error / 5xx**（生产构建 :3100）；四视口（1440/390 × 深浅）看图复核，查出一处规格不符并修复（移动端头条图丢失，见 T15）；Lighthouse desktop = **Performance 95 / A11y 100 / BP 100 / SEO 100**，FCP 1.0s、LCP 1.3s、TBT 0ms、CLS 0.007、首屏字体 6 片 **213KB**。**相对 S17 全 100 掉 5 分**，主因 total-byte-weight（5.86MB，几乎全是 OSS 未裁剪的封面原图）与 entry.css 内含 101 条 `@font-face`（分片方案固有成本）；图片优化归内容层（OSS resize 参数），字体方案不改
  - **Lighthouse 在本机有显著抖动**（2026-10-27 同版本连跑三次：Perf 64 / 64 / 93，TBT 0~1190ms、LCP 1.4~3.7s、长任务 199~1561ms），稳定值 **Perf 93~95**。**单次低分不得当作回归结论**，须连跑 2~3 次取稳定值；跑之前先确保没有并行 build / 截图进程
  - **跑法**：`chrome --headless=new --remote-debugging-port=9222 --user-data-dir=... ` 手动起浏览器，再 `lighthouse <url> --port=9222`。直接 `npx lighthouse <url>` 会失败——`chrome-launcher` 在本机误判为 Windows，拼出 `undefined:/Users/undefined/AppData/...` 的临时目录，报 "Unable to create temp directory"

### P4 逐页重排（4~5d，一页一 commit）

- [x] T14 壳层：`AppHeader`（导航激活改 2px 全宽下边框，`scaleX` 过渡且 hover 同几何）、`AppFooter`（单行编辑式收尾：衬线站名 22px + `/` + tagline 13px，© 归左栏第二行）、`AppBrand`（衬线站名，去 `drop-shadow` 发光）、`layouts/default`（**删除 BgDrift 漂移层**、上留白 24px）；顶栏/页脚容器改 `max-w-1440`（比正文 1180 更宽，导航铺开内容收窄）
- [x] T15 首页：`FeaturedPost`（LATEST 头条，仅第 1 页；文字左 + 右图 260×146；**<768 改 `flex-col-reverse` 图满宽 16:9 在上**——T13 回归查出窄屏用 `hidden sm:block` 把头条图一并隐藏，与 §4.2「头条图保留」不符，已修）+ `PostRow`（数据行，掘金式右图 132×76 + 三层信息）+ 右栏双卡 + `CtaBand` 改编（2px 深线起头 + 左对齐 + `03 // CONTRIBUTION`）
  - **`SectionMark`**（编号锚点）与 **`SystemStatus`**（状态卡）新增；后者 2026-10-27 按用户要求**删除**（hero 右侧留白过多，改单栏 `max-w-[760px]`）
  - 右栏 chip 底色踩坑：Stitch 的 `surface` 是米白、`surface-container-lowest` 才是白，与我们命名相反，照抄导致卡片与 chip 同色（详见 `.impeccable.md` 原则 2）
  - `ArchiveGroup` / `ArticleCard` 已删除（见孤儿清理）
- [x] T16 文章详情：`prose.css` 重写（66ch / 18px / 1.75、段距 24px、引用块 2px 主色左边线无底色、正文图去边框）；代码块升级为 `.sd-code > 顶部栏（语言标签 + 复制钮）+ pre`（语言取自 `language-*` 类，缺省 `CODE`，**不编造文件名**）；编辑器语言下拉修复（外层 `overflow-hidden` 把面板裁掉 → 去掉，圆角由 toolbar/body 分别承担；`min-width 200` / `max-height 280` / 8px 滚动条 / `z-index 60`）
  - 详情页封面去重：自动封面会把正文首图回填进 `coverUrl`，导致顶部封面与正文首图重复；改用 `showCover` 判断「封面地址是否已作为 `<img>` 出现在本篇正文」（纯正则、SSR 安全、URL 元字符已转义）
- [x] T17 标签页 `/tags`（`01 // INDEX` + 衬线 h1 + chip 云不包卡片）与 `/tag/[slug]`（改 `PostRow`、**取消按月分组**）
- [x] T18 搜索页 `/search`（`PostRow` **内置服务端高亮**：`titleHtml`/`summaryHtml` 走 `v-html`，`summary 命中 > content 命中 > 原摘要` 降级，`em` 用 accent-soft 底，深 6.43:1 / 浅 7.20:1）+ `/page/[n]`（同换 `PostRow` 并去分组）；顺带修搜索框 autofill 白框（inset 兜底色由 `--surface` 改 `--elevated`）与 Chrome 原生清除钮
- [x] T19 用户页 `/user/[userId]`：资料区去面板（`01 // AUTHOR` + 衬线昵称），列表换 `PostRow` 并去分组
- [x] T20 作者中心：`/me`（`01 // WORKSPACE` + 衬线 h1 + 底线）、`/me/profile`（去 `sd-card`）、`ArticleForm`（**双顶栏 64+56**、主区 `grid lg:grid-cols-[1fr_320px]`、右栏 `sticky top-[132px]` 常驻设置、标题输入改衬线、「更多」`lg:hidden`）、新增 **`ArticleSettingsPanel`**（桌面右栏与移动抽屉共用同一份标记）、`PublishDrawer` 瘦身为纯外壳
  - 字段缺失提示：原先按钮绑 `:disabled="!canSave"`，字段不填点击毫无反馈；改为只在提交中禁用，点击时告知缺哪项
- [x] T21 浮层与状态：`LoginModal` / `AppConfirmDialog`（并补 1px 边框）/ `AppToaster` / `PublishDrawer` 的 `shadow-e3`（已归零）统一换 `--shadow-float`；`error.vue` 404 由渐变文字改衬线大字 + 主色；`LoginModal` 错误提示改「图标 + 浅红底」提示块
  - 评论区双空态：未登录且零评论时 `EmptyState` 与 `CommentForm` 各渲染一次，改为 `EmptyState` 仅在 `logged` 时出现

### P5 plus-ui 小改（0.5d，独立仓独立 commit）

- [x] T22 **缩水完成（2026-10-27 用户拍板：后台首页不再改，就这样）**：仅移除 `login.vue` 的第三方登录入口——微信/maxkey/topiam/Gitee/GitHub 五个圆形按钮、`doSocialLogin()`、两个只为它存在的 import（`authRouterUrl`/`HttpStatus`）、三段 CSS 及媒体查询两段；保留 `api/system/social/auth.ts` 与 i18n 的 `login.social.*`（删 locale 易牵连，收益为零）。`index.vue` **不改**。
  **未执行**：`vue-tsc` 类型检查与登录 E2E 复测——本次为纯删除、未触及验证码链路与 SocialCallback 路由；已做 `oxlint`（0 警告 0 错误 / 251 文件）与 `vite build`（成功）

### 每片完成定义

```
npm run build 通过
tooling/shot/shot.mjs 退出码 0（桌面 1440 + 移动 390）
四视口实测：桌面/移动 × 深色/浅色，无横向滚动、无文字截断
涉及色值改动：contrast.mjs 全过（P3/P4 期间每片都跑）
```

### 发文/编辑页信息结构（T24 依据，2026-10-26 定）

数据字段以现有 `ArticleForm.vue` 为准，**不新增字段**：

| 区块 | 内容 | 来源 |
|---|---|---|
| 顶部操作条 | 返回、页面标题（新建文章 / 编辑文章）、状态徽标（草稿/已发布/用户隐藏/管理员下线）、保存状态文字（有未保存更改 · 已保存 HH:mm）、保存按钮（描边）、发布按钮（实底） | 现有 `saveStateText` / `visibility` / `status` |
| 主区 | 标题（必填）、标签（1~6 个，必填≥1）、富文本正文（必填） | `title` / `tagNames` / `content` |
| 右栏（桌面常驻，<1024 收进「更多」抽屉） | 封面（可选，16:9）、摘要（可选，纯文本）、发布信息（状态 + 首次发布时间）、版本历史（最近 3 条 + 查看全部） | `coverUrl` / `summary` / `publishedAt` / VersionHistory |

版式决策：现状是「摘要/封面/版本全收进『更多』抽屉」（渐进披露），桌面宽屏下改为**右栏常驻设置栏 320px + 吸顶**，移动端仍走抽屉——抽屉组件保留不删。

禁止出现（无对应字段或 MVP 不做）：分类/专栏、SEO 面板、关键词、OG 图、定时发布、协作/审稿、评论设置、AI 写作、模板选择、草稿箱列表。

## 2.22 S24 正文语法高亮（方案 B：保存时高亮，2026-10-27 立项）

> 状态权威在 ROADMAP §2/§3 S24 与决策 **D43**（后端仓库），本节只做任务拆解。
> 三方案对比、五个待决策（D1~D5）与阶段门禁见 ROADMAP §3 S24，此处不重复。

**本轮红线**

1. 高亮产物必须**幂等**：保存前一律「取 `<code>` 的 textContent 重新高亮」，不做增量叠加。
2. 标记用 **class（`tok-*`）**，不用 inline style——后端白名单只需校验 `^tok-[a-z0-9]+$`，彻底规避 `style` 注入面。
3. 不改 `app/types/**` 与接口出入参；`content` 仍是字符串，只是内部多了一层 span。
4. **历史文章不批量重刷**；作者重新保存一次即自然获得高亮。
5. plus-ui 不同步，接受两端发文体验不一致（记入 D3）。

### P1 往返验证（0.3d，**不过门禁不继续**）

- [x] T25 **WangEditor 往返实验（2026-10-27 已完成，用本地最小页面，无需登录态）**：加载 UMD 包（`dist/index.js`，全局 `window.wangEditor`）起独立页面，对五组 HTML 做 `setHtml → getHtml`：

  | 输入 | 输出 | 结论 |
  |---|---|---|
  | `<code class="language-js"><span class="tok-x">const</span>…` | `<code class="language-js">const…` | **span 被剥**（Slate 无对应 mark）|
  | `<code class="language-js">…` | 原样 | **language 类保留** ✓ |
  | `<pre data-lang="js">` | `<pre>` | data-lang 丢失，备选方案无效（也不需要） |
  | `<code>a\nb</code>` | `<code>a<br>b</code>` | `\n` → `<br>`（一次转换） |
  | `<code>a<br>b</code>` | `<code>ab</code>` | **`<br>` 读回时被吃掉** ← 见 T26-a |

  **门禁结论：方案 B 成立**——language 类存活，span 被剥掉反而让幂等更简单（编辑器内永远是纯文本，保存时重新生成，不存在嵌套）。
  **附带发现一个既有缺陷**：代码块换行往返不一致（`getHtml` 输出 `<br>`、`setHtml` 不认 `<br>`），意味着「作者打开编辑页 → 再保存」会把多行代码压平。与高亮无关，但方案 B 每次保存都要往返，**必须一并修**（见 T26-a）。

### P2 前端高亮管线（0.7d）

- [x] T26-a **换行规范化（2026-10-27 完成，commit `488c12e`）**：新增 `app/utils/codeBlock.ts` 的 `normalizeCodeNewlines()`——保存前把 `<pre>` 内的 `<br>`/`<BR>`/`<br/>` 统一转 `\n`（只处理 pre 内部，段落里的手动换行原样保留），`ArticleForm.payload()` 应用；`prose.css` 的 `.prose pre` 补 `white-space: pre`。
  **顺带查明第二个既有缺陷**：`.prose pre` 之前是默认 `white-space: normal`，`\n` 被渲染成空格 → 库里存 `\n` 的代码块其实一直显示为「挤在一行」，这才是"代码块只有一个空框"的真正原因（不是没内容）。
  验证：单测 5 例全对（单块 / 段落 br 保留 / 多个 pre / 无 pre / 带属性 + `<BR>` 大小写）；生产构建实测 computed `white-space = pre`、某文章 `innerText` 行数 6；build 绿（8.10s）。
  已知副作用（用户已决定不处理）：`white-space: pre` 生效后正文多余空行会真实占高度，"空行撑高"比之前明显
- [x] T26 新增 `app/utils/highlight.ts`（shiki 细粒度 API）：`createHighlighterCore` + `createJavaScriptRegexEngine`（避开 200KB+ oniguruma wasm）+ `transformerStyleToClass`；12 种语言显式注册表按需 `import()`；别名归一（js→javascript / sh→shellscript / py→python / htm→html）；`>800 行`跳过；已含 `tok-` 类则跳过（幂等）。
  **关键实现决策**：用 `structure: 'inline'`——默认输出会包一层 `<span class="line">`，那个 class 不带 `tok-` 前缀会被后端剥掉；inline 模式直接是 `tok-*` 序列。代价是它用 `<br>` 分行，故渲染后再 `.replace(/<br>/g, '\n')` 回到 T26-a 的入库约定。
  体积实测（esbuild，core + JS 引擎 + 双主题 + 1 语言）：entry **53.4KB** gzip，主题各 2.5KB，语言包 16.3KB，**首屏合计约 74.7KB**（< 100KB 门禁）。
  **真实产物确认**：编辑页 chunk 836K 解包 / **262KB gzip**（含 WangEditor 原有约 200KB，shiki 增量约 60KB）；**首页不引用该 chunk**——读者首屏零增量。
- [x] T27 接入保存链路：`ArticleForm.payload()` 改为 async，`content` 改为 `await highlightCodeBlocks(normalizeCodeNewlines(content.value))`（normalize 在前，兜住"没有 language 类、不会被高亮"的块）；`persist()` 同步改 `await payload()`。高亮内部五道防线全部返回原文，**不阻断发文**。
- [x] T28 生成并接入 token CSS：新增 `tooling/gen-highlight-css.mjs`（12 种语言各跑一段覆盖常见 token 的样本，合并 `getCSS()` 去重），产出 **`app/assets/css/highlight.css` — 9 个 token 类、仅 1.1KB**；经 `nuxt.config.ts` 的 `css` 数组紧跟 `prose.css` 引入。
  应用层两条规则把 shiki 的 CSS 变量映射到 `color`：`.prose pre span[class^='tok-']` → `var(--shiki-light)`，`.dark` 下 → `var(--shiki-dark)`。
  门禁实测：详情页注入 tok span 后读 computed color，**浅色 `rgb(215,58,73)` / 深色 `rgb(249,117,131)`，与 github-light/dark 定义完全一致 → PASS**。

### P3 后端白名单（0.3d）

- [x] T29 `HtmlSanitizer`（不是 Service，净化逻辑在 `org.dromara.blog.util.HtmlSanitizer`）：
  - `buildSafelist()` 增 `.addAttributes("span", "class")`——jsoup 1.19.1 的 `relaxed()` 不带全局 class，`span` 原本连 class 都保不住；
  - 新增 `SAFE_TOKEN_CLASS = ^tok-[a-z0-9]+$` 与 `stripUnsafeTokenClasses(Document)`，在 `HTML_CLEANER.clean()` **之后**逐个校验 span 的 class token，非法一律移除；
  - 幂等：对已净化内容二次执行结果不变（单测覆盖）。
  门禁实测：**13 个单测全过**（原 10 + 新增 3：合法 tok 保留、`admin`/`header`/`evil` 混合场景只留 tok、二次净化幂等）。

### P4 契约与回归（0.2d）

- [x] T30 `blog-api.md` §3.1 白名单说明**在 S24 立项时已写入**（允许 `span[class]` 且值须匹配 `^tok-[a-z0-9]+$`、不放开 `style`、历史文章不回溯），本轮复核无需改动。
- [x] T31 回归：`npm run build` 绿（9.71s）；`shot.mjs` **44 张退出码 0、无 console error / 5xx**（生产构建 :3100）；`contrast.mjs` **18/18 全过**；双主题着色用 Playwright 实测 PASS（见 T28 门禁）。
  **注意**：历史文章正文没有 tok span，截图里的代码块仍是纯文本——高亮需要作者重新保存一次才生效（已接受的边界）。

## 2.23 S27 阅读体验三项（TOC / 图片压缩 / 关于页，2026-10-28 实施）

> 状态权威在 ROADMAP §2/§3 S27。三项互相独立，**均不依赖后端契约**，零后端改动。

**三条红线**

1. TOC 必须是 **SSR 可渲染的纯函数**——不能等 hydration 后扫 DOM（首屏无目录、锚点不在 SSR 输出、水合不一致）。
2. 图片压缩**绝不阻断上传**——GIF/SVG 跳过、压缩后更大用原图、任何异常回落原文件。
3. 校验顺序必须是「硬上限 → 压缩 → 业务上限」，反了会让大图在压缩前就被误拒。

### T1 文章目录

- [x] `app/utils/toc.ts` 的 `buildToc(html)`：正则扫 `h2`/`h3` → `{ html, items }`。锚点用**序号** `sec-N`（中文 slug 化不可读、重复标题会撞 id）；剥标签取纯文本并解码 HTML 实体；空标题跳过；已带 `id` 的标题跳过注入并纳入目录，新 id 会避开已占用的编号（**幂等**，二次调用结果完全相同）。
- [x] `app/components/ArticleToc.vue`：`variant='aside'`（宽屏 sticky，`top-24` 避开固定顶栏）与 `'inline'`（窄屏 `<details>` 折叠）共用同一份列表；当前小节高亮走 `IntersectionObserver`（`rootMargin: '-80px 0px -70% 0px'`，只在 `onMounted` 里注册）。
- [x] 详情页改双栏：`lg:flex lg:justify-center lg:gap-16`。**用 flex 不用 grid**——grid 的 `1fr` 会让正文在自己那一列内 `mx-auto`，整体重心偏左、目录贴右；flex 让「正文 756 + 目录 200」整体居中，两侧留白各 76px。
- [x] 正文 `v-html` 改用 `toc.html`（注入锚点后的版本）；`showCover` 仍读原始 `version.content`，两者互不影响。
- [x] 标题数 < 2 时不渲染目录（一个标题出目录没有意义，还占右侧空间）。

### T2 上传前图片压缩

- [x] `app/utils/imageCompress.ts`：长边 1600 / q0.85。GIF（canvas 只取首帧会毁动图）与 SVG（矢量无需压）**原样返回**；PNG 缩放后仍导出 PNG（转 JPEG 会把透明区变黑）；尺寸与体积都已达标时不重编码（二次编码掉画质且常变大）；压缩结果 ≥ 原体积、或任何异常，一律回落原文件。
- [x] 接入 `CoverField.onChange` 与 `ArticleEditor.customUpload`；两处校验顺序统一改为「硬上限 20MB → 压缩 → 业务上限（maxSizeMb / maxImageMb）」，压缩失败的提示里带上压缩后的实际体积。
- [x] `ArticleEditor` 的 `insertFn` alt 改用压缩后的文件名（扩展名可能已由 png/webp 变为 jpg）。

### T3 关于页

- [x] `app/pages/about.vue`：`06 // ABOUT` + 衬线 h1「关于本站」+ `.prose` 五块（这个站在做什么 / 谁在写 / 写了什么 / 怎么做的 / 联系与订阅）。整页 `sd-measure mx-auto` 居中——文字型页面若左对齐于 1180 容器，行长过长且右侧空一大块。
- [x] 导航：`AppHeader.navItems` 与 `AppFooter` 各加一条「关于」。
- [x] 内容写成**长期成立的事实**，不放「最近在做什么」这类会过期的表述；不放个人身份信息。

### 回归

- [x] `shot.mjs` 页面清单加入 `about` → **50 张退出码 0、无 console error / 5xx**（生产构建 :3100）。
- [x] `contrast.mjs` **18/18 全过**。
- [x] 实测：详情页 SSR 输出含 `id="sec-1..5"`（锚点在服务端就存在）；1440 宽屏 aside TOC 可见且 5 条、`<details>` 隐藏；390 窄屏 aside 隐藏、折叠面板可见；`/about` 200 且标题正确。


