# Stack Depth · 设计 Mockup（桶A 视觉定稿）

这里是 blog-web 前台的**静态设计原型**（HTML/CSS/SVG），用于桶A 版式/配色/组件的定稿与评审，**不是应用代码**，不参与 Nuxt 构建（位于 `app/`、`server/` 之外）。真实实现按 ROADMAP S9（读者）/ S12（作者中心）/ **S23（视觉改版）** 在 `app/` 内落地。

> ⚠️ **2026-10-26 起视觉基线已迁移（D41 / S23）**：现行方向为 **C —— 冷米白 + 深靛蓝 + Noto Serif SC 衬线标题 + 统一 3px 圆角 + 近乎零阴影**。
> 权威取值 = `../app/assets/css/tokens.css`（代码即规范）；版式依据 = `stitch/README.md` §4.1 冻结规格表。
> **本目录 15 份 mockup 属暖纸风历史稿**——版式结构仍可参考，但**配色、字体、圆角、黄 CTA、三级阴影一律作废**，不要照着取色。

> ⚠️ **本目录是设计参考与规范基线，不是逐像素照抄的成品。** 落地到 `app/` 时按真实代码风格组件化（该封装就封装）、遵循可维护/可扩展/可读与 SSR 安全，配色/字号/间距走 `uno.config.ts` 的 token，勿把内联样式/魔法数字搬进页面。实现纪律细则见 `../AGENTS.md`。

## 查看方式
在本目录起一个静态服务器即可（相互都是相对链接）：

```bash
cd design && python3 -m http.server 4599 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:4599/ （index.html 为导航 hub）
```

每页右上角可切换 **深色 / 浅色** 主题；拖动窗口宽度可看响应式。

## 设计体系
- **配色**（2026-10-09 质感打磨轮换色，**2026-10-26 D41 起作废**）：原为蓝灰阶 + 黄 CTA；现行为冷米白 + 深靛蓝（浅 `#FCF9F8` / `#1A4D8F`，深 `#131415` / `#6E9BE0`），以 `app/assets/css/tokens.css` 为准。
  色板来源 sun-summit 模板（`blue-100/200/300/500/700` + `yellow-500` + `almost-black`，模板只给浅色，
  深色由同一色相派生）；分层机制来源 jason.blog（色阶分层 + 半透明分隔线 + 三档文字）。**旧的“青 + 炭黑”已作废**。
  权威 token 以 `app/assets/css/tokens.css` 为准；本目录 `tokens.css` 是桶A 历史稿，仅供对照，不再同步。
- **Logo**：几何"错位叠框"母题，三件套 —— `logo-mono.svg`（currentColor 单色）、`logo-duotone.svg`（双色随主题）、`favicon.svg`（内嵌 prefers-color-scheme）。
- **排版**：Tailwind/UnoCSS 字号阶梯 + 正文 68ch 行宽 + 系统字体栈（不加载中文 webfont）。
- 决策依据：品牌视觉 / Logo / 首页 Hero / 作者中心边界见后端仓库 `docs/ROADMAP.md` §6（D28/D29）与本仓库 `AGENTS.md`、`docs/plan.md`。

## 页面清单
| 文件 | 页面 | 归属 |
|---|---|---|
| `index.html` | 导航 hub | — |
| `tokens.html` / `tokens.css` | 设计 Token 规范 | 桶A |
| `app.css` | 共享外壳样式 | 桶A |
| `home.html` | 首页（Hero + 漂浮层占位） | S9 |
| `article.html` | 文章详情（正文 prose/TOC/评论） | S9 |
| `tag.html` | 标签页 | S9 |
| `search.html` | 搜索页 | S9 |
| `user.html` | 用户公开主页 | S9 |
| `author-articles.html` | 作者中心 · 我的文章 | S12 |
| `author-editor.html` | 作者中心 · 新建/编辑（WangEditor 占位） | S12 |
| `profile.html` | 作者中心 · 个人资料 | S12 |
| `shell.html` | 全站 Shell 与导航 | 桶A |
| `states.html` | 状态版式（骨架/空/错误/404） | 桶A |
| `responsive.html` | 响应式规则表 | 桶A |
| `polish-compare.html` | **质感改造对比稿**（Before/After 并排，含按钮/输入/卡片/弹层/动效规格） | 打磨轮 |
| `mechanisms.md` | **质感机制对照表**（6 个参照站实测数据 + M1~M17 机制清单 + 已锁规格） | 打磨轮 |
| `home-options.html` | **首页方案对比稿**（A 薄条+卡片 / B 薄条+编辑式 / B2 无卡片壳 / C 现状大 hero，背景光斑真联动、可开关隔离变量） | 打磨轮 |

> `shots/` 不是设计稿，是 `tooling/shot/shot.mjs` 拍出的**现状基线截图**（已 gitignore、可重生、每次跑先清空）；
> 本目录其余文件是“应该长什么样”的目标基线，`shots/` 是“现在长什么样”的证据。

## 约定
- 装饰动效（three.js 漂浮层、发光）属**桶B**，MVP 后独立叠层，`home.html` 的 hero 槽位仅为占位示意。
- 作者中心走 `/blog/article|user/**` 作者自助层；平台治理 `/blog/admin/**` 不在前台（红线）。
