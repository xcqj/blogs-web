import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetTypography,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

// blog-web UnoCSS 配置（D28 裁剪自 plus-ui；桶A 落地 design/tokens.css 的 token 单一来源）
// - 配色/字号/圆角/阴影全部指向 CSS 变量（app/assets/css/tokens.css），深浅主题自动切换
// - 去 Element Plus 相关、去 auto-import（Nuxt 原生）；留 wind3/attributify/typography/icons + transformers
// - presetWind3 默认断点 sm640/md768/lg1024/xl1280 = D28 响应式口径，不自造断点
export default defineConfig({
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    // 容器两档：列表/首页宽档 1080，正文窄档 68ch
    'sd-wrap': 'mx-auto w-full max-w-[var(--container)] px-5',
    'sd-measure': 'max-w-[var(--measure)]',
    // 卡片 / 面板
    'sd-card': 'rounded-md border border-border bg-elevated',
    'card-hover': 'transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_30px_var(--glow-soft)]',
    // 按钮
    'btn-primary': 'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-glow transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0',
    'btn-ghost': 'inline-flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 py-2 text-sm font-semibold text-text transition hover:border-primary',
    // 标签 chip
    'sd-chip': 'inline-flex items-center rounded-full border border-[var(--chip-border)] bg-chip px-2.5 py-0.5 text-xs text-primary-strong',
    // meta 行小圆点分隔符（design .dot）
    'sd-dot': 'inline-block h-1 w-1 shrink-0 rounded-full bg-muted',
    // 次级文本 / 小标题
    'sd-muted': 'text-sm text-muted',
    'sd-eyebrow': 'text-xs uppercase tracking-[1.5px] text-muted'
  },
  theme: {
    colors: {
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      elevated: 'var(--elevated)',
      text: 'var(--text)',
      muted: 'var(--text-muted)',
      border: 'var(--border)',
      primary: 'var(--accent)',
      'primary-strong': 'var(--accent-strong)',
      'primary-ink': 'var(--accent-ink)',
      chip: 'var(--chip-bg)',
      code: 'var(--code-bg)'
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
    boxShadow: {
      glow: 'var(--shadow-glow)',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)'
    }
  },
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography({
      cssExtend: {
        // preset-typography 用 :where() 零特异性，正文细节由 assets/css/prose.css 以 token 覆盖
        'a': { color: 'var(--accent)', 'text-decoration': 'none' },
        'a:hover': { 'text-decoration': 'underline' }
      }
    }),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle'
      }
    })
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()]
});
