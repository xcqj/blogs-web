# blog-web · Stack Depth 博客前台

Nuxt 4 SSR 前台（读者站 + 登录作者中心，D29）。定位、红线与实现清单见 `AGENTS.md`、`docs/plan.md`；
视觉基线在 `design/`（参考非照抄）。后端契约与切片状态在同级仓库 `../RuoYi-Vue-Plus/docs/`。

## 环境变量（必读）

复制 `.env.example` 为 `.env` 并填值（`.env` 不入库）：

- `NUXT_APP_CLIENT_ID`：`sys_client` 的 `web` 记录 client_id，由
  `../RuoYi-Vue-Plus/docs/blog_s9_web_client.sql` 建立（与 plus-ui 的 `pc` 会话隔离）。
- `NUXT_RSA_PUBLIC_KEY` / `NUXT_RSA_PRIVATE_KEY`：后端 `api-decrypt.enabled=true` 且 `/auth/login`
  带 `@ApiEncrypt`，登录请求须按此密钥对加/解密；值与后端 `application.yml` 配对，生产必须更换。

⚠️ `npm run dev` 会自动加载 `.env`；**直接 `node .output/server/index.mjs` 不会**，缺 `NUXT_RSA_PUBLIC_KEY`
时登录会降级明文并被后端拒绝（表现为“没有访问权限，请联系管理员授权”）。生产启动请用下面的 `npm start`。

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm（推荐：带 --env-file-if-exists 加载 .env，登录加密链路依赖其中密钥）
npm start

# 或 Nuxt 自带预览（同样会读 .env）
npm run preview
```

> 容器/生产环境不必放 `.env`：直接注入 `NUXT_API_BASE`、`NUXT_APP_CLIENT_ID`、
> `NUXT_RSA_PUBLIC_KEY`、`NUXT_RSA_PRIVATE_KEY` 四个环境变量即可（见 `Dockerfile` 与后端仓库
> `script/docker/docker-compose.dev.yml` 的 `web` 服务）。

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## S17 PWA + SEO（2026-10-14 实施）

ROADMAP v0.4 S17 切片：PWA 应用化 + SEO 三件套。**零后端改动**（数据源全部走既有 `/blog/public/**`），只动本仓。

### SEO 端点

| 端点 | 说明 |
|---|---|
| `/sitemap.xml` | sitemap **索引**（protocol: sitemapindex）。先查公共列表拿 total 计算块数 |
| `/sitemap/{n}.xml` | 分块 urlset，每块 500 篇（`SITEMAP_CHUNK_SIZE`）。2 万篇 → 41 块；演示数据清理后自然收缩为 1 块。每条含 `loc`（`/post/{articleId}`）+ `lastmod`（W3C datetime） |
| `/rss.xml` | RSS 2.0，最新 20 篇公共文章（title/link/guid/pubDate/description，XML 转义） |
| `/robots.txt` | Nitro 动态产出（原静态文件已删）：`Disallow: /me/` + `Disallow: /register` + 绝对地址 `Sitemap:` 行 |
| `/post/{id}` 页 | JSON-LD `Article`（headline/description/image/datePublished/dateModified/author/publisher/mainEntityOfPage）+ `<link rel="canonical">` + ogUrl/ogImage，在既有 `useSeoMeta` 基线上扩展（D30：不引 `@nuxtjs/seo`） |

- 服务端 `defineCachedEventHandler` 缓存（sitemap 10min / rss 30min）+ `Cache-Control` 响应头，爬虫高频访问不重复打后端。
- 站点绝对地址统一取 `runtimeConfig.public.siteUrl`（默认 `http://localhost:3000`，`NUXT_PUBLIC_SITE_URL` 覆盖；**S13 上线时配真实域名**）。

### PWA

`@vite-pwa/nuxt@1.1.1`（→ vite-plugin-pwa 1.3.0，兼容本仓 vite 8）+ **injectManifest 手写 SW**（`app/sw/sw.ts`）。选 injectManifest 而非 generateSW 的原因：generateSW 的 `navigateFallback` 是 SPA app-shell 语义（导航一律回退文档），与 SSR 站「文章页 SWR + 离线回退」组合会互相遮蔽；手写 SW 才能逐条审计缓存红线。

SW 缓存策略（顺序即优先级）：

| # | 匹配 | 策略 | 说明 |
|---|---|---|---|
| ① | 预缓存清单 | precache | app shell：构建 js/css + public 资源（favicon/offline.html/图标） |
| ② | 文档导航**白名单** `/` `/page/` `/post/` `/tag/` `/tags/` `/user/` | stale-while-revalidate | 秒开 + 后台更新；`handlerDidError` 回退 `/offline.html` |
| ③ | `/api/blog/public/**` | network-first（3s 超时回落缓存） | 公共匿名数据；100 条 / 24h 上限 |

**缓存红线（硬性）**：

- `/me/**` 路由（作者中心）**不进 SW 缓存**——② 为白名单匹配，`/me/**` 不在列即直通网络，从构造上杜绝（非黑名单）；
- 需登录 API（`/api/blog/article|user|auth|resource/**`）**不注册任何 SW 规则**，请求 cookie 与响应一律不落缓存；
- `registerType: 'autoUpdate'`（新版本自动接管）；dev 不注册 SW（`devOptions` 关闭），验收走生产构建；
- 与 Nitro 代理兼容：SW 只拦截浏览器同源请求，SSR 期服务端→后端调用对 SW 不可见。

**iOS 限制（实事求是）**：iOS Safari **不支持 Service Worker**——离线阅读、安装到主屏幕后的独立窗口体验在 iOS 上不可用；`apple-touch-icon`（180px）仍生效（"添加到主屏幕"有品牌图标）。PWA 完整体验（安装/离线）需桌面或 Android Chrome；线上 HTTPS 下的完整体验归 S13。localhost 属 secure context，本地可完整开发验收。

### Lighthouse 验收留档（2026-10-15，Windows 侧 Chrome，生产构建）

| 类别 | 分数 | 备注 |
|---|---|---|
| SEO | **100** | JSON-LD / meta / canonical / robots / sitemap 全过 |
| Performance | **100** | 参考值，不作 S17 门槛 |
| Accessibility | **100** | — |
| Best Practices | **96** | 非 S17 门槛，详情未追（无阻断项） |
| PWA | —（无此类别） | **Lighthouse 12.0（2024-05）起移除了 PWA 类别**，当前 Chrome DevTools 不再跑 PWA 分；可安装性改由 Chrome 地址栏安装图标 + DevTools → Application 手动核验 |

PWA 手动核验（已由 Agent 无头 Chrome 全链路复验 + 人工复测清单）：

- [x] Service Worker 注册并激活（`/sw.js`，activated and controlling）
- [x] Cache Storage：`workbox-precache-v2-*`（49 条：js/css + offline.html + 图标 + manifest + `_nuxt/builds`）、`sd-pages`、`sd-public-api`
- [x] 断网**刷新**已读文章：200 完整渲染
- [x] 断网导航未读文章：回落 `/offline.html`（"当前离线"页）
- [x] 断网直开 `/offline.html`：200
- [x] `/me/**` 与认证 API 零缓存（白名单构造 + 无头实测 `sd-pages` 无 `/me` key）
- [ ] 人工复测：Chrome 地址栏安装图标可安装到桌面（按钮级验收留人工）

### 验收期根因修复记录（2026-10-15，headless Chrome 复现定位）

人工验收首测发现 SW 全部不生效（DevTools：`redundant`、零缓存、断网全失败）。无头 Chrome 复现后定位到**两个独立根因**，均已修复并全链路复验（详见 commit `9195294`）：

1. **`@vite-pwa/nuxt` 生产默认 `manifestTransforms` 会改写 `.html` 条目 URL**——它面向「预渲染路由页」把 `offline.html` 改成 `offline`（clean-URL 规则），导致预缓存请求 404 → SW install 失败被静默丢弃。修法：`nuxt.config` 提供自定义 `manifestTransforms`（保留 `.html` 原 URL，复刻模块对 `_nuxt/builds` appManifest 的 revision 处理）。
2. **顶层直接调用 `self.skipWaiting()/clientsClaim()` 会导致 Chrome 下 SW 脚本求值失败**（注册同样被静默丢弃）。修法：移入 `activate` 事件（规范位置）。
3. 附带修复：离线回退原先用 `caches.match('/offline.html')` 匹配不到带 `?__WB_REVISION__` 查询串的预缓存键，改用 `matchPrecache('/offline.html')`。

> 调试方法备忘（面试可讲）：Node 桩环境求值 sw.js → Playwright 无头 Chrome 复现（`channel: 'chromium'`，headless shell 不支持 SW）→ 给 workbox-build 打桩 dump manifestEntries → 二分定位到模块默认 transform。这类「模块默认假设与自定义 public 页面冲突」的问题，看 DevTools 的 `redundant` 状态 + 零缓存即可快速识别。

### 本地验收步骤

```bash
npm run build
# 注意：3000 若被 nuxt dev 占用，用 NITRO_PORT 换端口起生产服务
NITRO_PORT=3100 node .output/server/index.mjs
# 打开 http://localhost:3100
```

人工验收清单：① Lighthouse SEO 等分数已填上表（PWA 类别已被 Lighthouse 移除，见上）；② DevTools → Application → Service Workers 确认已注册、Cache Storage 三个缓存齐全；③ DevTools Network 切 Offline，**刷新**一篇已读文章仍可读、未读导航回落 `offline.html`；④ 登录态访问 `/me` 确认无任何缓存写入（红线）；⑤ view-source 抽验 `/post/{id}` 的 JSON-LD；⑥ 移动视口回归（含 390px 滚动中态：顶栏与进度条应一并收起，commit `0f0a57e`）；⑦ iOS Safari 人工确认上述限制描述属实；⑧ 若浏览器曾装过修复前的坏 SW：DevTools → Application → Service Workers → Unregister 后刷新。

图标再生成（品牌标记改版时）：`node tooling/gen-pwa-icons.mjs`（纯 Node 写 PNG，本机无 PIL/rsvg，产物落 `public/icons/`）。

## S20 Lenis 平滑滚动（2026-10-15 实施）

ROADMAP v0.4 S20 切片（D38 动效收缩后**仅保留 Lenis**；hero 视差 / 逐字进场待定，**不引 three.js / GSAP**）。纯表现层：无契约/数据/状态机改动，只动本仓三处（依赖 + 一个 client 插件 + 一段 CSS），整体删除即恢复原状。

- `app/plugins/lenis.client.ts`（`.client` 后缀 = SSR 安全）：全局单例，`lenis@1.3.26`。配置为**温和默认**：`lerp: 0.1`（约 300~400ms 惯性），`syncTouch` 关闭（**移动端触摸保持原生跟手**，平滑只作用于桌面滚轮/触控板），`stopInertiaOnNavigate: true`（点击站内链接时清零惯性，与路由滚到顶、页面过渡不打架）。
- **无障碍**：`prefers-reduced-motion: reduce` 时**完全不初始化**（html 上无 lenis class，原生滚动），并监听 `matchMedia` change——会话中途切换系统偏好即时生效。Lenis 自带的 `respectReducedMotion` 选项只影响 programmatic scrollTo，不禁用滚轮平滑，故门控必须自建（源码核实）。
- `transitions.css` 追加官方推荐配套规则：平滑滚动期间（`lenis-smooth` class 存在时）把 `scroll-behavior` 中和为 `auto`，避免与 tokens.css 的 `scroll-behavior: smooth` 双动画叠加。
- 与既有动效零冲突：顶栏方向感知 / 阅读进度条监听原生 scroll 事件（Lenis 驱动真实 scrollY，照常触发）、v-reveal 走 IntersectionObserver、弹层滚动锁用 body overflow。
- ⚠️ **坑（Nuxt 4.6 实测）**：`app/plugins` 下 bare 包的静态默认导入会被 auto-import transform（unimport）整体剥离，运行时报 `Lenis is not defined` 白屏；插件内改用动态 `import('lenis')`（顺带代码分割）。与「`app/directives` 不会被自动注册」并列为本仓两个 transform 坑，详见 `docs/plan.md` §2.17。
- 验证：`npm run build` 绿；无头 Chrome 冒烟全 PASS（lenis class、wheel 平滑渐进曲线、reduce 下回退原生滚动、SW 注册态无冲突、三视口零 console error）。
- ✅ 人工验收通过（2026-10-15）：桌面滚轮/触控板手感、移动端真机跟手、系统减少动态效果切换实测、PWA 安装态叠加，均确认无问题。

## 视觉基线截图（本地验证工具，不参与构建）

`tooling/shot/` 是一个**独立小包**：不写进主 `package.json`、不进 `dependencies`、不进 Docker 镜像。
它用 Playwright 无头 Chromium 拍全站基线图到 `design/shots/`（已 gitignore），
并在任一页出现 console error / page error / 5xx 时以**退出码 1** 结束，可直接当回归门禁。

```bash
cd tooling/shot
npm i                              # 装 playwright（一次）
npx playwright install chromium    # 下浏览器到 ~/.cache/ms-playwright（一次，约 120MB）

node shot.mjs                                  # 全量：页面 × 3 视口(1440/768/390) × 2 主题
node shot.mjs --only=home,post                 # 只拍指定页
node shot.mjs --views=mobile --themes=dark     # 只拍窄屏深色
SHOT_TOKEN=<blog-web-token 值> node shot.mjs --only=editor   # 作者中心页需登录态时传 cookie
```

每次运行会**先清空** `design/shots/`，避免旧命名与新版截图混在一起。

配套 `contrast.mjs`：token 对比度检查器，把“文字看不看得清”变成数字（WCAG 2.1，正文 ≥ 4.5:1，大字/图形 ≥ 3:1）：

```bash
node tooling/shot/contrast.mjs     # 改一个色值就重跑，确认没改坏可读性
```

设计对比稿在 `design/polish-compare.html`（Before/After 并排，可切主题、真点 hover 与 Toast）。

### WSL 免 root 环境准备（本机已配好；重装后照此恢复）

精简 WSL Ubuntu 上的无头 Chromium 会缺两类东西，**都不需要 sudo**，解包到本目录即可（`.libs/`、`.fonts/` 已 gitignore）：

```bash
cd tooling/shot && mkdir -p .libs .fonts
mkdir -p /tmp/dl && cd /tmp/dl
apt-get download libnss3 libnspr4 libasound2t64 fonts-wqy-microhei   # 免 root 下载
for f in *.deb; do dpkg -x "$f" /tmp/px; done
cd -
cp /tmp/px/usr/lib/x86_64-linux-gnu/*.so* .libs/
cp -r /tmp/px/usr/share .fonts/          # 保持 .fonts/usr/share/fonts 层级，脚本按此路径生成 fontconfig
```

- 缺 `libnss3/libnspr4/libasound2` → 浏览器启动即退出（报 `Target page, context or browser has been closed`）；脚本会把 `.libs` 注入 `LD_LIBRARY_PATH`。
- 缺中文字体 → 中文全渲染成豆腐块 `□□□`，截图失去判断价值；脚本检测到 `.fonts/usr/share/fonts` 就自动生成 fontconfig（绝对路径运行时拼，不写进仓库）。
- 若有 root，`sudo npx playwright install-deps chromium` 可替代上面的 `.libs` 方案（中文字体仍需自装）。

> 注意：容器内中文字体是 **WQY 微米黑**，与你本机系统字体字形不同。截图用于判断**布局、层次、配色、间距、状态反馈**，不用于判断字体观感。
