# AGENTS.md — blog-web 博客前台（Nuxt 4 SSR）

## 项目
- PC + 移动浏览器**响应式单套代码**的博客前台（读者站 + 登录作者自助的**作者中心**，D29），RuoYi-Vue-Plus 博客 MVP 的第三个独立仓库（D21/D27）
- 技术栈：Nuxt 4（SSR）+ Vite + Vue3 + TS + 文件路由 + 自动导入 + UnoCSS（裁剪自 plus-ui）+ `@nuxtjs/seo`/`@nuxt/image`/shiki（D28）
- **无组件库**：正文排版用 preset-typography（`prose`）+ 薄自研组件
- 远端仓库 `git@github.com:xcqj/blogs-web.git`，本地目录 `blog-web`，与后端、plus-ui 同级 clone（后端仓库 `docs/SETUP.md` §10）
- 后端仓库：`../RuoYi-Vue-Plus`（多根工作区下可见）

## 权威源（引用，不复制）
- API 契约：`../RuoYi-Vue-Plus/docs/blog-api.md`（接口路径/出入参/权限标识以其为准，冲突先报告）
- 切片计划与状态：`../RuoYi-Vue-Plus/docs/ROADMAP.md`（S9/S12 节 + §6 D21/D27/D28/D29 决策）
- 环境搭建 / 同级布局 / 建仓约定：`../RuoYi-Vue-Plus/docs/SETUP.md` §10
- 系统架构：`../RuoYi-Vue-Plus/docs/architecture.md`
- 本仓库编码规范 skill：`.codex/skills/nuxt-frontend-coding/SKILL.md`（`.qoder/skills/` 下同名条目是指向它的符号链接，勿复制出第二份实体）

## API 边界（红线，三层不得混用）
blog-web 是**读者前台 + 登录作者中心**（仍非管理端），只允许两层接口（契约 §1/§15、SETUP §10.4、D29）：
- 公共只读：`/blog/public/**`（文章列表/详情、搜索、标签、用户公开资料、评论列表）——匿名，走后端 `security.excludes`
- 登录作者/读者：`/blog/article/**`、`/blog/user/**`（评论发表等读者行为 **+ 作者中心自助发文/编辑/发布/隐藏/删除自己的文章**，D29）——要求登录
- **禁止 `/blog/admin/**`**：平台级治理（他人文章下线/恢复、标签 rename/merge、评论审核）是管理后台（plus-ui）职责，前台不得调用，也不得给前台分配任何治理入口；作者管理**自己的**文章走 `/blog/article/**`，不属此列

作者「发文/编辑/隐藏/删除自己的文章」在 blog-web **作者中心**（**D29 修订，原 D24 撤销**）：走 `/blog/article/**` 作者自助层，复用已登录 `web` 会话、无需二次登录；编辑器复用 WangEditor（`@wangeditor-next/*` 6.4.1）`<ClientOnly>` 按需加载、**不上 Markdown**；平台治理仍只在 plus-ui（详见 ROADMAP S12）。

## 认证与安全（红线）
- token 走 **cookie（httpOnly）+ Nitro server route 代理**（D28）：浏览器不持有 token，`/auth/login` 等经服务端代理转发，顺带规避 CORS；clientid 用新建的 `web` 记录（`NUXT_APP_CLIENT_ID`，见 `.env`），**不在业务代码手写 Authorization/clientid 头**
- `web` 客户端记录由 `../RuoYi-Vue-Plus/docs/blog_s9_web_client.sql` 建立，与 plus-ui 的 `pc` 会话隔离，grantType 仅 password
- 作者中心（D29/S12）复用同一 `web` 会话与 Nitro 代理调用 `/blog/article/**`，登录用户发文/编辑**无需二次登录**
- **不信任前端做权限判断**：`authorId`、身份、可见性一律以后端为准（后端仓库 AGENTS.md §5/§9、契约 §1.2/§1.3）
- 公共可见三条件（`status='1' AND visibility='0' AND del_flag='0'`）由后端过滤，前台不得拼接出绕过可见性的查询
- 不把真实密钥/生产 token 写进代码或提交；`.env` 不入库（`.env.example` 提交占位）

## SSR 安全（硬性要求）
- 组件渲染期在服务器执行：浏览器 API（`window`/`document`/`localStorage`/`navigator`）**一律不得裸用**，需封装进仅在客户端运行的 composable/插件，或用 `<ClientOnly>` / `import.meta.client` 守卫
- 服务端数据获取用 `useAsyncData` + `$fetch`（走 Nitro 代理到后端基址），不要在 SSR 阶段读 `useCookie` 之外的客户端状态
- 富文本正文是后端已净化的 HTML（`v-html` 渲染 + `prose` 排版），前台不再二次信任未净化内容
- WangEditor 等纯浏览器富文本组件必须 `<ClientOnly>` / `ssr:false` 包裹，作者编辑页以 CSR 为主，不进服务端渲染（D29/S12）

## 编码规范与技能
- 新增/修改页面、SSR 数据获取、Nitro 代理、UnoCSS/prose 样式，动手前先读 `.codex/skills/nuxt-frontend-coding/SKILL.md` 与其 references
- 信息源优先级（与后端 AGENTS.md §4 同序）：① blog-web 仓库内真实页面/组件（同类页优先）→ ② `../RuoYi-Vue-Plus/docs/` 权威文档 → ③ 本仓库 skill 资产 → ④ 通用 Nuxt/Vue/UnoCSS 知识（最低，禁止照搬通用模板）

## 工作流
- 响应式策略（D28）：只拍一张桌面骨架，移动/平板由 UnoCSS 默认断点（sm640/md768/lg1024/xl1280）推导，实现期真机微调
- alias → canonical 的 301 由 Nitro server middleware 原生实现（D28，契约 §7.3 边缘层方案作废）
- 页面清单（D28 / ROADMAP S9）：`/` `/page/{n}` `/post/{slug}` `/tag/{slug}` `/search` `/user/{userId}` + 登录/评论弹层；内容页 SSR，评论提交/登录交互 CSR
- 作者中心页面清单（D29 / ROADMAP S12，登录态 CSR）：我的文章列表、新建/编辑（WangEditor `<ClientOnly>`）、发布/隐藏/重新公开/删除动作；具体路由命名开发时定，不进读者首屏/SEO
- 每个切片闭环：契约确认 → 页面实现 → 联调 → 浏览器验收（含移动视口）→ 小步 commit（信息标 S9）
- 构建/校验命令只在 `blog-web/` 目录内执行（`npm run ...`），不在父目录执行
