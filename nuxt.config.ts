// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SSR 前台站：内容页服务端渲染（D28）
  ssr: true,

  modules: [
    // UnoCSS：读取根目录 uno.config.ts，自动注入样式（@unocss/nuxt 内置 virtual css）
    '@unocss/nuxt'
  ]
})

