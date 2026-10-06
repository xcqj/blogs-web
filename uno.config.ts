import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetTypography,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss';

// blog-web UnoCSS 配置：以 plus-ui/uno.config.ts 为蓝本裁剪（D28）
// - 去 Element Plus 相关：删除 --el-* CSS 变量依赖的配色与 panel-title shortcut
// - 去 auto-import：Nuxt 原生自动导入，无需额外配置
// - 保留：presetWind3（与 plus-ui 同语法，默认断点 sm640/md768/lg1024/xl1280 = D28 响应式口径）
//         + presetAttributify + presetTypography（正文 prose 排版）+ presetIcons（mdi 集合）
export default defineConfig({
  shortcuts: {
    // 通用布局/交互快捷类，随页面骨架增量补充，不预置业务样式
    'flex-center': 'flex items-center justify-center',
    'card-hover': 'transition-shadow hover:shadow-md'
  },
  theme: {
    colors: {
      // 博客前台品牌主色（非管理后台，无 EP 变量依赖）
      primary: '#3b82f6'
    }
  },
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography({
      cssExtend: {
        // 正文链接与代码块的基础排版微调，细节在页面实现期真机微调
        'a': { color: '#3b82f6', 'text-decoration': 'none' },
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
