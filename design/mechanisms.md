# 质感机制对照表（打磨轮 · 2026-10-10）

> 用途：把"质感"拆成可逐条判定的机制，每条都带**实测证据**（从参照站 CSS/JS 里取到的数字），
> 避免凭形容词改风格。**本表只讨论机制，不改已锁规格。**

## 0. 已锁规格（吸收任何机制都不得触碰）

| 项 | 值 | 锁定时间 |
|---|---|---|
| 色板 | sun-summit 蓝灰阶 + 黄 CTA（深色由同色相派生） | 2026-10-09 |
| 圆角 | 控件 2px / 卡片弹层 4px / 仅 chip 与头像胶囊 | 2026-10-09 |
| 字体 | 不加载任何 webfont（含拉丁），走系统栈 | 2026-10-09 |
| 反馈分层 | inline / toast / banner / confirm / undo 五层 | 2026-10-09 |
| 动效基线 | 三档时长 140/200/280ms + 两条曲线；只动 transform/opacity/shadow/color/background | 2026-10-09 |

想改以上任何一条，必须明说"我要改 X"，不接受"看着这个模板好看顺便换掉"。

## 1. 参照源实测数据（全部为 curl 取到的真实文件统计）

| 参照 | 取到的东西 | 关键数字 |
|---|---|---|
| jason.blog（博客） | WordPress 块主题，156 个 CSS 变量 | 全站仅 **2 处圆角**（`50%` 与一处 `4px`）；`box-shadow:none!important`；三档墨色 ink/ink-2/ink-3；半透明边框 `rgba(0,0,0,.15)`；body 18px/1.55；**动效只有 1 条 `opacity .1s`** |
| sun-summit（模板，已选色） | 单文件 CSS 30KB | `blue-100/200/300/500/700` + `yellow-500`；圆角 token 8/16/32/48；几乎无阴影，层次靠色块 |
| revoul（模板） | 单文件 CSS 38KB | **响应式圆角变量** `--_responsive-radius`；`transition: all .3s/.7s`；引 `lenis.css`（平滑滚动）；仅 1 个 keyframes |
| deploy（模板） | CSS 187KB + JS | 载 `gsap.min.js`；HTML 里 **34 处 `data-w-id`**（Webflow 元素级交互绑定）；127 变量；`backdrop-filter` 2 处 |
| arthur-jones（模板） | CSS 60KB + JS | 载 `gsap` + **`ScrollTrigger`** + **`SplitText`**；30 变量（最克制）；CSS 里 `transition` 仅 1 处 |
| inflouno（模板） | CSS 184KB + JS | 载 `gsap` + `ScrollTrigger` + `SplitText` + **`lenis`** + **`three`**；87 变量但 **28 个不同 border-radius 值** |

**两个总结论**：

1. **CSS 自定义曲线出现 0 次**（三站 `cubic-bezier` 全无）→ 质感不是靠 CSS 曲线，而是
   **进场与滚动联动全部由 JS（GSAP + ScrollTrigger）驱动**，CSS 只管 hover 微过渡。
2. **反面教材同样明确**：inflouno 28 个圆角值 = 我们已消灭的"没规矩"；三站大量
   `transition: all .3s` = 会连带动画 layout 属性导致掉帧。我们现在用显式属性列表，比它们规范。

## 2. 机制对照表

判定列：**吸收**（建议做）/ **已有** / **可选**（要拍）/ **不吸收** / **已排期**

| # | 机制 | 证据 | 我们现状 | 判定 | 成本 |
|---|---|---|---|---|---|
| M1 | **弹层进出场动画**（scale+fade / slide） | deploy 34 处交互绑定 | 抽屉有滑入；**登录弹层 `v-if` 硬出现，无动画** | **吸收** | 低（CSS 即可） |
| M2 | Toast 进出场 | — | ✅ 280ms 进 / 200ms 出 | 已有 | — |
| M3 | **平滑惯性滚动**（Lenis） | revoul、inflouno 均载 | 只有 `scroll-behavior: smooth` | 可选 | 低（MIT ~8KB）但有晕动风险 |
| M4 | **滚动进场 reveal** | 三站全部载 gsap，两站载 ScrollTrigger | 无 | **吸收**（用 IntersectionObserver 零依赖） | 低 |
| M5 | **滚动联动 / 视差**（scrub、pin） | arthur-jones、inflouno | 无 | 可选（只给 hero 叠层做轻视差） | 中 |
| M6 | **标题逐字进场**（SplitText） | arthur-jones、inflouno | 无 | 可选（**中文逐字效果一般**，更适合拉丁/数字） | 中 |
| M7 | **路由页面过渡** | Webflow 站靠 page-load 交互 | 无（硬切，观感"廉价"的主要来源之一） | **吸收**（Nuxt 原生 `<NuxtPage :transition>`） | 低 |
| M8 | **骨架 → 内容交叉淡入** | — | 无（直接替换，视觉"跳") | **吸收** | 低 |
| M9 | **图片懒加载 + 宽高占位防 CLS** | — | 无（只有 `max-width`） | **吸收**（`loading="lazy"` + `aspect-ratio`） | 低 |
| M10 | **阅读进度条**（详情页） | 长文站标配 | 无 | **吸收**（博客刚需，滚动位置联动） | 低 |
| M11 | **header 滚动方向感知**（下滑隐藏 / 上滑出现） | 移动优先站标配 | 无（永远吸顶） | **吸收**（移动端收益最大） | 低 |
| M12 | hover 微过渡（bg/border/shadow/位移） | 三站 `.1~.3s` | ✅ L2 已系统化且更规范（显式属性列表） | 已有 | — |
| M13 | 统一 easing 与时长 | 三站 CSS 无自定义曲线 | ✅ 两条曲线三档时长 | 已有 | — |
| M14 | `backdrop-filter` 毛玻璃遮罩 | deploy/inflouno 各 2 处 | ✅ 弹层/抽屉已用 | 已有 | — |
| M15 | **`prefers-reduced-motion` 全站尊重** | — | 🟡 只在 toast 里做了 | **吸收（必须）** | 低 |
| M16 | 响应式圆角变量 | revoul | 单一 2/2/4（已锁） | **不吸收** | — |
| M17 | three.js 主视觉 | inflouno | 槽位已留 | 已排期（桶 B，MVP 后） | — |

## 3. 授权核实（决定"能不能用"）

- **GSAP**：3.13（2025-04-29）起 **core 与全部 bonus plugin 一律免费可商用**，含
  `SplitText`、`ScrollTrigger`、`MorphSVG`、`ScrollSmoother`；SplitText 完全重写、体积减 50%、内置无障碍。
  来源：gsap.com/blog/3-13、css-tricks 同期报道。**所以 M5/M6 不存在授权障碍。**
- **Lenis**：MIT。**GSAP 之外唯一值得考虑的滚动库**。
- Space Grotesk / Inter：OFL-1.1（已核实，但已决定不加载字体）。

结论：**"能不能用"不是问题，"要不要为 80% 效果引入 30KB 依赖"才是问题。**
建议先用零依赖（IntersectionObserver + CSS transition + Nuxt 原生 transition）做掉 M1/M4/M7/M8/M9/M10/M11/M15，
把 GSAP 留给桶 B 与真正需要时间轴/scrub 的那一两处。

## 4. 分批落地

- **批 1（零依赖、高感知）**：M1 弹层动画、M7 路由过渡、M8 骨架淡入、M15 reduced-motion 全局、M9 图片占位
- **批 2（零依赖、中感知）**：M4 滚动 reveal、M10 阅读进度条、M11 header 方向感知
- **批 3（需你拍板）**：M3 Lenis 平滑滚动、M5 hero 视差、M6 拉丁/数字逐字进场
- **桶 B（MVP 后）**：M17 three.js 漂浮层（槽位已留）

每批一个 commit + 重拍 `design/shots/` 基线对比；`tooling/shot/shot.mjs` 的退出码须回 0。

> **进度的唯一事实源是 `docs/plan.md` §2.12**（本表不重复维护勾选状态）。截至 2026-10-10：
> 批 1（M1/M7/M8/M9/M15）已落地，`shot.mjs` 退出码已回 0（44 张、控制台与网络无报错）。
