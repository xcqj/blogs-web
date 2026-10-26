import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetTypography,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

// blog-web UnoCSS 配置（D28 裁剪自 plus-ui；2026-10-26 方向 C 改版重排，ROADMAP D41 / S23）
// - 方向 C 要点：值全部来自 tokens.css；取消阴影、去胶囊、圆角统一 3px、黄 CTA 重定向到主色；
//   新增 sd-serif / sd-mark / sd-row / sd-meta 四个语义类供 P4 逐页落地使用
// - btn-cta 暂时保留（值已在 tokens.css 重定向为 --accent），P4 改调用点后再删
// - 配色/字号/圆角/阴影/动效全部指向 CSS 变量（app/assets/css/tokens.css），深浅主题自动切换
// - 去 Element Plus 相关、去 auto-import（Nuxt 原生）；留 wind3/attributify/typography/icons + transformers
// - presetWind3 默认断点 sm640/md768/lg1024/xl1280 = D28 响应式口径，不自造断点
// - 按钮改为「基类 btn + 4 变体 + 3 尺寸」，五态（default/hover/active/focus-visible/disabled）齐备；
//   旧 btn-primary/btn-ghost 类名保留，页面无需批量改名
export default defineConfig({
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    // 容器两档：列表/首页宽档 1080（本轮不动），正文窄档 68ch；边距 24 / 桌面 32
    'sd-wrap': 'mx-auto w-full max-w-[var(--container)] px-6 lg:px-8',
    'sd-measure': 'max-w-[var(--measure)]',

    // ---------- 卡片 / 面板（方向 C）：取消阴影、取消上浮；层级只靠 1px 边 + 底色差 ----------
    'sd-card': 'rounded-lg border border-border bg-surface',
    'card-hover':
      'transition-[background,border-color] duration-200 ease-out hover:bg-elevated hover:border-border-strong',

    // ---------- 按钮：基类 + 变体 + 尺寸（小圆角 2px，主按钮不再发光） ----------
    'btn':
      'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-[background,border-color,color] duration-150 ease-out select-none disabled:cursor-not-allowed disabled:opacity-45',
    'btn-primary': 'btn bg-primary text-primary-ink hover:bg-primary-strong active:bg-accent-press',
    'btn-secondary':
      'btn border border-border-strong bg-elevated text-text hover:bg-raised active:bg-surface',
    'btn-cta': 'btn bg-cta text-cta-ink hover:bg-cta-strong active:bg-cta',
    'btn-ghost': 'btn bg-transparent text-muted hover:bg-soft hover:text-primary-fg',
    // soft 变体（清单7 顶栏登录钮降重量）：半透明 soft 底 + 前景强调字，hover 才升实底——
    // 深色顶栏少一块高反光实底，重量让位内容；黄 CTA 仍是全站唯一强焦点
    'btn-soft': 'btn bg-soft text-primary-fg hover:bg-primary hover:text-primary-ink active:bg-primary-strong active:text-primary-ink',
    'btn-danger': 'btn bg-danger-bg text-danger hover:bg-danger hover:text-danger-ink',
    'btn-sm': 'h-7.5 rounded-sm px-2.5 text-xs',
    'btn-lg': 'h-11 rounded-md px-5 text-base',
    'btn-pill': 'rounded-full',

    // ---------- 标签 chip（方向 C）：去胶囊，改 3px 小标签；3px 圆角 + 细边 + soft 底 ----------
    'sd-chip':
      'inline-flex items-center rounded-sm border border-border bg-soft px-2 py-0.5 text-xs font-medium text-primary-fg transition-[background,border-color,color] duration-150 ease-out',
    'sd-chip-link': 'sd-chip hover:border-primary hover:bg-primary hover:text-primary-ink',

    // ---------- 表单控件：与按钮同族同高（38px），focus 出 3px 半透明环 ----------
    'sd-input':
      'h-9.5 w-full rounded-md border border-border-strong bg-elevated px-3 text-base text-text outline-none transition-[border-color,box-shadow,background] duration-150 ease-out placeholder:text-dim focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-line)] disabled:opacity-45',
    'sd-textarea':
      'w-full min-h-30 resize-y rounded-md border border-border-strong bg-elevated px-3.5 py-3 text-sm text-text outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-dim focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-line)] disabled:opacity-45',
    // 搜索框一体化：放大镜 + 输入 + 内嵌按钮共享圆角与 ring（不再"框是框、按钮是按钮"）。
    // 内部 input 的无边框/透明底/占位色由本 shortcut 统一给，调用方只写宽度类。
    'sd-search':
      'flex h-9.5 items-center gap-2 rounded-md border border-border-strong bg-elevated pr-1 pl-3 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--accent-line)] [&_input]:min-w-0 [&_input]:flex-1 [&_input]:appearance-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-base [&_input]:text-text [&_input]:outline-none [&_input]:placeholder:text-dim',
    'sd-field': 'mb-4.5',
    // 表单标签降级（三轮精修：用户反馈登录框「像二十年前的管理后台」——独立加粗标签行是
    // 表单表格感的来源）：text-sm  semibold muted → text-xs 常规字重 dim，只降字号/字重/色阶，
    // 不动 mb-1.5 间距（字段节奏不变）。全局生效（SdInput/SdTextarea label + 直接使用方：
    // 登录框/注册页/CoverField/me-profile/PublishDrawer），设计系统单一来源纪律
    'sd-label': 'mb-1.5 block text-xs font-normal text-dim',
    'sd-hint': 'mt-1.5 text-xs text-dim',

    // ---------- 作者中心（S12）：行、徽标、小动作、tab ----------
    'sd-row':
      'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-e1 transition-[background,border-color,box-shadow] duration-200 ease-out hover:bg-elevated sm:flex-nowrap sm:gap-4',
    'sd-badge': 'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold',
    'sd-act':
      'inline-flex items-center justify-center gap-1.5 rounded-md border border-border-strong bg-elevated px-2.5 py-1.5 text-xs text-muted transition-[background,border-color,color] duration-150 ease-out hover:bg-soft hover:text-primary-fg disabled:cursor-not-allowed disabled:opacity-45',
    'sd-act-primary': 'sd-act border-transparent bg-primary text-primary-ink hover:bg-primary-strong hover:!text-primary-ink',
    'sd-act-danger': 'sd-act hover:border-danger hover:text-danger',
    'sd-tab':
      'border-b-2 border-transparent px-3.5 py-2.5 text-sm text-muted transition-[color,border-color] duration-150 ease-out hover:text-text',
    'sd-tab-on': 'sd-tab border-primary text-text font-semibold',

    // ---------- 方向 C 新增（2026-10-26，供 P4 逐页落地使用） ----------
    // 衬线标题：只给 H1 级（hero / 文章大标题 / 头条 / 正文 H2）；
    // 列表行 18px 标题不用衬线——既省字体流量（unicode-range 分片按需下载）也更好读
    'sd-serif': 'font-[var(--font-serif)] font-bold',
    // 编号锚点：01 // SECTION（等宽大写、次级色、字距放开）
    'sd-mark': 'font-mono text-xs uppercase tracking-[0.08em] text-dim',
    // 数据行：上下 16px + 底部发丝线 + hover 换底（列表统一行容器，替代卡片）
    'sd-row':
      'flex gap-5 border-b border-border py-4 transition-[background-color] duration-150 ease-out hover:bg-elevated',
    // meta 行：12px 次级色 + 8px 间距（作者 · 日期 · 阅读量 · 右端标签）
    'sd-meta': 'flex flex-wrap items-center gap-2 text-xs text-muted',

    // ---------- 排版辅助：标题字距走 token（负字距是质感主力） ----------
    'sd-h1': 'text-3xl font-bold tracking-[var(--ls-h1)]',
    'sd-h2': 'text-2xl font-bold tracking-[var(--ls-h2)]',
    'sd-muted': 'text-sm text-muted',
    'sd-dim': 'text-xs text-dim',
    'sd-eyebrow': 'flex items-center gap-2.5 text-sm font-bold text-text before:block before:h-px before:w-5 before:bg-dim',
    // 归档分组头（jason.blog 年月归档语义）：组头标签 + 右侧发丝线与计数由使用方模板给
    'sd-archive-head': 'flex items-center gap-2.5 text-sm font-bold text-muted',
    // meta 行小圆点分隔符（design .dot）
    'sd-dot': 'inline-block h-1 w-1 shrink-0 rounded-full bg-dim opacity-60',
    // 列表缩略图：统一去饱和，消除真实照片与扁平 UI 的素材感
    'sd-thumb': 'rounded-md object-cover [filter:var(--thumb-filter)]',

    // ---------- elevation 三级（阴影只表达高度，不做装饰） ----------
    'sd-elev-1': 'shadow-e1',
    'sd-elev-2': 'shadow-e2',
    'sd-elev-3': 'shadow-e3',
    // 遮罩层：深色下必须够黑 + 模糊，否则背景仍清晰、弹层浮不起来
    'sd-scrim': 'fixed inset-0 bg-[var(--scrim)] backdrop-blur-[6px]',
    // Toast 内部件（action 与关闭钮）：默认不可见，hover 才出底色
    'sd-toast-act':
      'shrink-0 self-center rounded-sm px-2 py-1 text-xs font-semibold text-primary-fg transition-[background,color] duration-150 ease-out hover:bg-soft',
    'sd-toast-x':
      'shrink-0 rounded-sm border-0 bg-transparent p-1 text-dim transition-[background,color] duration-150 ease-out hover:bg-raised hover:text-text cursor-pointer'
  },
  theme: {
    colors: {
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      elevated: 'var(--elevated)',
      raised: 'var(--raised)',
      text: 'var(--text)',
      muted: 'var(--text-muted)',
      dim: 'var(--text-dim)',
      border: 'var(--border)',
      'border-strong': 'var(--border-strong)',
      primary: 'var(--accent)',
      'primary-strong': 'var(--accent-strong)',
      'primary-ink': 'var(--accent-ink)',
      'primary-fg': 'var(--accent-fg)',
      soft: 'var(--accent-soft)',
      'accent-press': 'var(--accent-press)',
      cta: 'var(--cta)',
      'cta-strong': 'var(--cta-strong)',
      'cta-ink': 'var(--cta-ink)',
      chip: 'var(--chip-bg)',
      code: 'var(--code-bg)',
      danger: 'var(--danger)',
      'danger-ink': 'var(--danger-ink)',
      'danger-bg': 'var(--danger-bg)',
      warn: 'var(--warn)',
      'warn-bg': 'var(--warn-bg)',
      'muted-bg': 'var(--muted-bg)'
    },
    fontFamily: {
      sans: 'var(--font-sans)',
      mono: 'var(--font-mono)'
    },
    // 覆盖 presetWind3 默认字号阶梯为设计 token（含阅读行高）
    fontSize: {
      xs: ['var(--text-xs)', { lineHeight: 'var(--lh-xs)' }],
      sm: ['var(--text-sm)', { lineHeight: 'var(--lh-sm)' }],
      base: ['var(--text-base)', { lineHeight: 'var(--lh-base)' }],
      lg: ['var(--text-lg)', { lineHeight: 'var(--lh-lg)' }],
      xl: ['var(--text-xl)', { lineHeight: 'var(--lh-xl)' }],
      '2xl': ['var(--text-2xl)', { lineHeight: 'var(--lh-2xl)' }],
      '3xl': ['var(--text-3xl)', { lineHeight: 'var(--lh-3xl)' }],
      '4xl': ['var(--text-4xl)', { lineHeight: 'var(--lh-4xl)' }],
      display: ['var(--text-display)', { lineHeight: 'var(--lh-display)' }]
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      full: 'var(--radius-full)'
    },
    // --shadow-sm/--shadow-md 已在 token 层并入 elevation 三级，这里做别名映射避免旧类名断链
    boxShadow: {
      glow: 'var(--shadow-glow)',
      sm: 'var(--e1)',
      md: 'var(--e2)',
      e1: 'var(--e1)',
      e2: 'var(--e2)',
      e3: 'var(--e3)'
    }
  },
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography({
      cssExtend: {
        // preset-typography 用 :where() 零特异性，正文细节由 assets/css/prose.css 以 token 覆盖
        'a': { color: 'var(--accent-fg)', 'text-decoration': 'none' },
        'a:hover': { 'text-decoration': 'underline' }
      }
    }),
    presetIcons({
      // ⚠️ unocss v66 的 presetIcons 默认入口（universal）不再自动从 node_modules 解析集合，
      // 必须显式注册，否则 i-mdi:* 一条 CSS 都不会生成（图标变空元素）。集合已装 @iconify-json/mdi。
      collections: {
        mdi: () => import('@iconify-json/mdi/icons.json').then((m) => m.default)
      },
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  // 运行时动态注入 DOM 的类名不在任何模板里，按源码字面量也扫不到（.ts 不在默认
  // 扫描范围，且放开扫描会被工具链字符串误提取出损坏规则）——用 safelist 精确声明：
  // code-copy.client.ts 注入的复制/成功图标（清单5）
  safelist: ['i-mdi:content-copy', 'i-mdi:check']
});
