import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetTypography,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

// blog-web UnoCSS 配置（D28 裁剪自 plus-ui；质感打磨轮 2026-10-09 重排 shortcut 体系）
// - 配色/字号/圆角/阴影/动效全部指向 CSS 变量（app/assets/css/tokens.css），深浅主题自动切换
// - 去 Element Plus 相关、去 auto-import（Nuxt 原生）；留 wind3/attributify/typography/icons + transformers
// - presetWind3 默认断点 sm640/md768/lg1024/xl1280 = D28 响应式口径，不自造断点
// - 按钮改为「基类 btn + 4 变体 + 3 尺寸」，五态（default/hover/active/focus-visible/disabled）齐备；
//   旧 btn-primary/btn-ghost 类名保留，页面无需批量改名
export default defineConfig({
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    // 容器两档：列表/首页宽档 1080，正文窄档 68ch
    'sd-wrap': 'mx-auto w-full max-w-[var(--container)] px-5',
    'sd-measure': 'max-w-[var(--measure)]',

    // ---------- 卡片 / 面板：半透明边 + elevation，hover 升一级并轻微上浮（②B） ----------
    'sd-card': 'rounded-lg border border-border bg-surface shadow-e1',
    'card-hover':
      'transition-[background,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-elevated hover:border-border-strong hover:shadow-e2',

    // ---------- 按钮：基类 + 变体 + 尺寸（小圆角 2px，主按钮不再发光） ----------
    'btn':
      'inline-flex h-9.5 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-[background,border-color,color,box-shadow] duration-150 ease-out select-none disabled:cursor-not-allowed disabled:opacity-45',
    'btn-primary': 'btn bg-primary text-primary-ink hover:bg-primary-strong active:bg-accent-press',
    'btn-secondary':
      'btn border border-border-strong bg-elevated text-text hover:bg-raised active:bg-surface',
    'btn-cta': 'btn bg-cta text-cta-ink hover:bg-cta-strong active:bg-cta',
    'btn-ghost': 'btn bg-transparent text-muted hover:bg-soft hover:text-primary-fg',
    'btn-danger': 'btn bg-danger-bg text-danger hover:bg-danger hover:text-danger-ink',
    'btn-sm': 'h-7.5 rounded-sm px-2.5 text-xs',
    'btn-lg': 'h-11 rounded-md px-5 text-base',
    'btn-pill': 'rounded-full',

    // ---------- 标签 chip：同色相三件套（soft 底 + fg 字），不再高饱和抢戏 ----------
    'sd-chip':
      'inline-flex items-center rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-primary-fg transition-[background,color] duration-150 ease-out',
    'sd-chip-link': 'sd-chip hover:bg-primary hover:text-primary-ink',

    // ---------- 表单控件：与按钮同族同高（38px），focus 出 3px 半透明环 ----------
    'sd-input':
      'h-9.5 w-full rounded-md border border-border-strong bg-elevated px-3 text-base text-text outline-none transition-[border-color,box-shadow,background] duration-150 ease-out placeholder:text-dim focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-line)] disabled:opacity-45',
    'sd-textarea':
      'w-full min-h-30 resize-y rounded-md border border-border-strong bg-elevated px-3.5 py-3 text-sm text-text outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-dim focus:border-primary focus:shadow-[0_0_0_3px_var(--accent-line)] disabled:opacity-45',
    // 搜索框一体化：放大镜 + 输入 + 内嵌按钮共享圆角与 ring（不再"框是框、按钮是按钮"）
    'sd-search':
      'flex h-9.5 items-center gap-2 rounded-md border border-border-strong bg-elevated pr-1 pl-3 transition-[border-color,box-shadow] duration-150 ease-out focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--accent-line)]',
    'sd-field': 'mb-4.5',
    'sd-label': 'mb-1.5 block text-sm font-semibold text-muted',
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

    // ---------- 排版辅助：标题字距走 token（负字距是质感主力） ----------
    'sd-h1': 'text-3xl font-bold tracking-[var(--ls-h1)]',
    'sd-h2': 'text-2xl font-bold tracking-[var(--ls-h2)]',
    'sd-muted': 'text-sm text-muted',
    'sd-dim': 'text-xs text-dim',
    'sd-eyebrow': 'text-xs font-bold uppercase tracking-[0.06em] text-dim',
    // meta 行小圆点分隔符（design .dot）
    'sd-dot': 'inline-block h-1 w-1 shrink-0 rounded-full bg-dim opacity-60',
    // 列表缩略图：统一去饱和，消除真实照片与扁平 UI 的素材感
    'sd-thumb': 'rounded-md object-cover [filter:var(--thumb-filter)]',

    // ---------- elevation 三级（阴影只表达高度，不做装饰） ----------
    'sd-elev-1': 'shadow-e1',
    'sd-elev-2': 'shadow-e2',
    'sd-elev-3': 'shadow-e3',
    // 遮罩层：深色下必须够黑 + 模糊，否则背景仍清晰、弹层浮不起来
    'sd-scrim': 'fixed inset-0 bg-[var(--scrim)] backdrop-blur-[6px]'
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
  transformers: [transformerDirectives(), transformerVariantGroup()]
});
