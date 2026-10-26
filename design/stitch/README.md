# Stitch 屏台账 · blog-web 视觉改版（方向 C）

> **定位**：本目录只存「方案证据」与「Stitch → 代码的映射规则」，**不是代码规范**。
> 职责分工（改动前先看这里，别去别的文件找）：
> - 具体数值规范 → `app/assets/css/tokens.css`（代码即规范）
> - 设计叙述/原则/反参考 → `../.impeccable.md`
> - 任务与进度 → `docs/plan.md` §2.21（状态权威在 ROADMAP §2/§3 S23）
> - 决策记录 → 后端仓库 `docs/ROADMAP.md` §6 **D41**
>
> **Stitch 产物（HTML + 内联样式）不回译为代码**，只作视觉参考。禁止把 px 魔法值、内联 style、编造文案搬进 `app/`。

## 1. Stitch 项目

| 项 | 值 |
|---|---|
| 项目名 | `sd-blog` |
| 项目 ID | `projects/31028378707802566` |
| deviceType | `DESKTOP`（响应式单套代码，先定桌面骨架，D28 口径） |
| 创建时间 | 2026-10-25 |
| 当前绑定 design system | **方向 A（终端感）**：`colorMode: DARK`、`primary: #5efde4`、`headlineFont: JetBrains Mono`、圆角 0px |

## 2. 屏台账

| 屏名 | screen id | 尺寸 | 可见性 | 对应落地页 | 备注 |
|---|---|---|---|---|---|
| 首页1 | `bc88c8fa42294210a1f0c2cea0dee4e1-1792965828824-1792966664005` | 1280×2409 | **可见** | `/` | 含系统状态卡；hero 偏高（尚未按 240px 规格压缩） |
| 首页1.1 | `bc88c8fa42294210a1f0c2cea0dee4e1-1792965828824-1792966664005-1792968048787` | 1280×2006 | **hidden** | `/` | 更矮版本；若确认为定稿版需切回可见 |
| 残留「Generating Screen...」 | `10c547e60d824c369f672891945feeeb` | 1280×2409 | hidden | — | 生成残留，可清理 |
| 残留「Generating Screen...」 | `791636d5dcb743fdb632b47cf6faa929` | 1280×3349 | hidden | — | 生成残留，可清理 |
| 残留「Generating Screen...」 | `8afbcb825bd14714aa31cb8bea90642e` | 1280×1301 | hidden | — | 生成残留，可清理 |
| 残留「Generating Screen...」 | `a55b75f6f70d430d9073fb0a99ffd8b8` | 1280×2897 | hidden | — | 生成残留，可清理 |

**待补的屏（P1）**：深色版首页、文章详情页。生成后在此追加行，并填 screen id。

> 已知歧义（2026-10-26 记录）：`首页1`（2409）当前可见、`首页1.1`（2006）为 hidden，两者高度差 400px 正好是 hero 压缩量。讨论"hero 是否变小"时须先确认看的是哪一屏，否则会得出相反结论。

## 3. 待处理的两个台账风险

1. **design system 仍是方向 A**（终端感：电光青 + JetBrains Mono + 直角）。C 方向的屏是靠文字 prompt 覆盖出来的，designSystem 没换——**后续新屏会被拉回终端感**。
   修法：把方向 C 的规格写成 `DESIGN.md` → `upload_design_md`（base64）→ `create_design_system_from_design_md`（`deviceType: DESKTOP`）→ `list_design_systems` 存下 assetId → 之后所有 `generate_screen_from_text` 都带这个 `designSystem`。
2. **首页1.1 处于 hidden**。定稿前先确认哪一版是准，切回可见，避免下次会话选错屏。

## 4. 方向 C 规格摘要（给后续屏复用）

> 完整数值以 `tokens.css` 为准，此处只作 Stitch prompt 的输入。

| 项 | 浅色 | 深色 |
|---|---|---|
| 页面底 | `#FAF9F6` 冷米白 | `#131415` 中性偏冷黑 |
| 面 / 浮起面 | `#FFFFFF` / `#F8F5EE`→(C 版用 `#FFFFFF` 单层) | `#1A1C1F` / `#232629` |
| 主/次/三级文字 | `#111111` / `#55606B` / `#8B949E` | `#E8E6E1` / `#A0A6AD` / `#767C84` |
| 强调色 | `#1A4D8F` 深靛蓝 | `#6E9BE0`（必须提亮，原靛蓝在深底约 2.1:1） |
| 分隔线 | `rgb(17 17 17 / 0.12)` | `rgb(255 255 255 / 0.10)` |
| 阴影 | 近乎取消，仅 1px 边框分层 | 完全不用 |

- **字体三元组**：标题 `Noto Serif SC`（700，仅标题）/ 正文 `PingFang SC` 等系统无衬线（18px / 1.75，66ch）/ 数字与编号 `ui-monospace`（等宽对齐）
- **圆角**：统一 3px（全站唯一值，含按钮/输入/卡片/图片）
- **版式**：编号锚点 `01 / 02 / 03`；头条 `LATEST`；数据行列表（非卡片）；右栏双卡；hero ≤ 240px（不含导航）

## 5. 落地映射（Stitch 元素 → 代码落点）

| Stitch 元素 | 代码落点 | 说明 |
|---|---|---|
| 编号锚点 `01 // MANIFESTO` | 新建 `SectionMark.vue` + `sd-mark` shortcut | 可点击跳转对应区块（scrollspy） |
| `LATEST` 头条 | 新建 `FeaturedPost.vue` | **仅第 1 页**生效；第 2 页起退普通行 |
| 数据行列表（四段） | 新建 `PostRow.vue`，取代首页/搜索/标签/用户页的 `ArticleCard` | 缩略图 120×80(3:2) / 日期 76px 等宽 / 标题+摘要 2 行 / 阅读量右对齐；行高 112 |
| 系统状态卡（5 行） | 新建 `SystemStatus.vue` | 真值 5 项：RENDER=SSR / FRAMEWORK=Nuxt 4 / THEME=dark·light / MOTION=transform only / A11Y=WCAG AA。**不显示 build hash 与假日期** |
| 右栏标签卡 | 复用 `TagChip`（改小标签形态，非胶囊） | 热门带计数、精选不带，中间一条发丝线 |
| 右栏关于卡 | 新建 `AboutPanel.vue` | 站名 + 两行简介，禁止"主理编辑/更新频率/EST."类元数据 |
| 衬线大标题 | `--font-serif` + `sd-serif` shortcut | Noto Serif SC **仅用于标题**，正文仍无衬线 |
| 收尾区 | 改造 `CtaBand.vue` | 左对齐 + 2px 深线起头，取消居中大面板 |
| 顶栏导航 | 改造 `AppHeader.vue` | 导航仅 首页/标签/搜索；激活项 2px 下边框 |

## 6. 不吸收清单（落地时逐条核）

- 内联 `style`、px 魔法值、硬编码色值（一律回译成 token / shortcut）
- **编造数据**：ISSN、DOI、同行评议、编委会、审稿人、影响因子、接受率、PDF 下载、订阅、评论区、阅读时长、更新频率、"EST. 20XX"、假人名头衔
- **分类 / 专栏 / 话题 / 归档导航**：Category 永久舍弃（`AGENTS.md` §5 红线）
- 灰色占位块、「破图」图标、无封面时的固定宽高比留空
- 12px 以上大圆角、胶囊按钮（chip/头像除外）、阴影、渐变、发光、玻璃拟态
- 第二种彩色、暖色/黄色（旧 CTA 黄作废）、emoji 图标、彩色插画
- 满屏 hero、大数字指标卡、三列等宽功能卡、logo 墙

## 7. 降级规则（必须有，否则上线即翻车）

| 场景 | 规则 |
|---|---|
| 文章无 `coverUrl` | 缩略图区整体不渲染，标题左移填补；**不留白、不出灰块** |
| 文章无 `summary` | 摘要行不渲染，不预留行高 |
| 文章无 `tags` | meta 行不留多余分隔点 |
| 当前页文章 < 5 篇 | 头条仍取第 1 篇，"共 N 篇"照常 |
| 当前页文章 < 2 篇 | 取消头条形态，全部退普通数据行 |
| 第 2 页起（`/page/{n}`） | 取消 `LATEST` 头条 |
| 标签为空 | 标签卡显示"暂无"，不隐藏整卡 |
| 深色主题 | 图片 `brightness(0.95) saturate(0.92)`，避免照片比页面更亮 |

## 8. 生成纪律（避免重复踩坑）

1. 单屏生成 1–3 分钟；**超时不要重试**，用 `get_screen` 每 30s 轮询最多 10 次。
2. **新屏必须带 `designSystem` 参数**（见 §3 风险 1），否则风格漂移。
3. 局部微调用 `edit_screens`；探索版式用 `generate_variants(aspects: ["LAYOUT"], creativeRange: "REFINE", variantCount: 3)`；`REIMAGINE` 会推翻整个方向，谨慎。
4. 每屏生成后过一遍「数据契约」（§9）与「不吸收清单」（§6），不合格就重生成，不要将就。
5. 定稿后 `download_file` 取截图存 `design/stitch/shots/`，并把 screen id 补进 §2。
6. **不要在 Stitch 里反复调像素**——它只负责"看起来对不对"，精确数值由 `tokens.css` 决定。

## 9. 数据契约（写 prompt 时的允许清单）

```
导航：首页 / 标签 / 搜索（仅三项）
文章字段：标题、摘要、作者名、发布日期 yyyy-mm-dd、阅读量、标签（1~3 个）、封面图（可选）
标签字段：名称、文章数
全站字段：站名 Stack Depth、tagline「把技术一层层读到深处」、文章总数
分页：首页单页最多 10 篇
禁止：见 §6 与 §7
```
