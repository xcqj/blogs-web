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
- [x] 封面/正文传图：复用 `/resource/oss/upload`（契约 §2.4）经 Nitro 代理（`server/api/resource/oss/upload.post.ts`），前端不碰 token/clientid。
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
- [x] **自动封面（A 方案，零后端）**：`app/utils/firstImage.ts` 用 `DOMParser` 取正文首个 `<img src>`，仅接受 `/` 与 `http(s)://`（与后端 `validateCoverUrl` 白名单一致，跳过 `data:`/`blob:`/`oss:`）；`coverUrl` 为空时回填，手动选图优先。commit `0b8554c`。已知语义：**存的是快照**，日后删掉正文那张图封面不会自动消失（可手动改）。
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

## 2.16 S17 PWA + SEO 三件套（2026-10-13 规划）

- [x] `@vite-pwa/nuxt` 接入：manifest（名称/图标/主题色随 token）+ Workbox 策略（app shell precache / 文章页 stale-while-revalidate / API network-first）+ 离线回退页；**`/me/**` 与需登录 API 不进 SW 缓存**（红线）；iOS 无 SW 的限制写进 README
- [x] `sitemap.xml`（Nitro route 查公共列表生成，含 lastmod）
- [x] `rss.xml`（RSS 2.0，最新 N 篇公共文章）
- [x] JSON-LD：`/post` 注 `Article` 结构化数据（headline/author/datePublished，在现有 `useSeoMeta` 基线上扩展）
- [x] `robots.txt` 声明 sitemap
- [ ] 验收：Lighthouse PWA + SEO 分数留档（本地 Chrome）；断网刷新已加载文章可读；view-source 抽验结构化数据；移动视口回归（**留人工**）

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

## 2.17 S20 Lenis 平滑滚动（⏸ 待定，核心完成后）

> D38 收缩后范围：仅 Lenis；hero 视差 / 逐字进场待定；**不做 three.js、不引 GSAP**。纯表现层，无契约/数据/状态机改动，独立 commit 随时可砍。

- [ ] 引入 Lenis（约 30KB）+ 与 `useScrollDirection()` / 阅读进度条 / v-reveal 的叠加回归
- [ ] `prefers-reduced-motion` 兜底（transitions.css 已有，确认 Lenis 同样尊重）
- [ ] 验收：桌面/移动滚动手感人工确认；与页面过渡、PWA 无冲突

## 2.18 S15 阅读量 Redis 异步计数（blog-web 侧，2026-10-14 实施）

> 后端改造（ViewCountService 两段 Lua / flush / 降级 / 契约 §5.2 语义修订）见 ROADMAP S15 与 D35；本节只列 blog-web 侧。核心收益：详情读路径不再写 DB 行锁，同人 30min 窗口去重。

- [x] `server/utils/blog.ts`：`blogGet` 增可选 `headers` 参数（默认空，向后兼容，其余 19 个代理零改动）
- [x] `server/api/blog/public/articles/[id].get.ts`：种/读 `blog-web-visitor` httpOnly cookie（`node:crypto` `randomUUID()`，maxAge 1 年，secure=!dev/sameSite lax）→ 以 query `visitorId` 转发后端；已登录时经 `getAuthCookie` 读 session cookie 转发 `Authorization` 头（服务端读取不触浏览器），使后端按 userId 去重优先于 visitorId
- [x] 自测：`npm run build` 绿 + 产物抽验（详情代理 chunk 的 `getCookie/setCookie/getAuthCookie/blogGet/randomUUID` 全部正确 import，延续 S14 抽验纪律）
- [ ] 联调验收（待用户重启 8081 + dev）：同一浏览器 30min 内重复打开同一文章，`viewCount` 只 +1；DevTools 确认 `blog-web-visitor` 为 httpOnly 且请求带 `?visitorId=`；换浏览器/清 cookie 后再打开 +1；DB 值在 10s 内追上展示值（`docker exec blog-mysql` 只读 SELECT）；停 Redis 降级演练留人工
- ⚠️ 与 S14 同源的两个既有纪律继续适用：① 新增 `server/utils` 文件才需重启 dev（本次只改既有文件，HMR 即生效）；② SSR 期需要登录态的 fetch 用 `useRequestFetch`（本次详情代理是服务端路由、不涉及）

**联调期修复（2026-10-14，SSR cookie 断链·第二现场，commit 见下）**：修复 Redisson codec 陷阱后，「每次刷新阅读量仍 +1」——根因：`/post` 详情页 SSR 取数用全局 `$fetch`，**内部请求不转发浏览器 Cookie**（与 S14 useAuth 同款坑的第二个现场），详情代理因此读不到 visitorId cookie（SSR 每次生成新 UUID，去重永不命中）也读不到 token（登录用户不走 userId 去重）；SPA 内导航是浏览器直连所以一直正常，故只有「刷新/直达」暴露。修复：`/post/[slug].vue` 的文章 useAsyncData 改 `useRequestFetch()`。实证：带 `blog-web-visitor` cookie 打 SSR 页面 → Redis 出现对应 `v{}` 去重键；带 token+visitor → 出现 `u{}` 键（登录 userId 路径）。**纪律补丁：今后任何「SSR 取数 + 下游服务端路由依赖 cookie」的链路，取数侧一律 `useRequestFetch`；服务端路由能种/读 cookie 不代表调用方带得了 cookie（curl 直打代理两种都正常，极具迷惑性）**
