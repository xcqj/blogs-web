// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SSR 前台站：内容页服务端渲染（D28）
  ssr: true,

  modules: [
    // UnoCSS：读取根目录 uno.config.ts，自动注入样式（@unocss/nuxt 内置 virtual css）
    '@unocss/nuxt',
    // 深浅主题：默认跟随系统、可手动切；偏好写 cookie 供 SSR 读取，首屏无闪烁
    '@nuxtjs/color-mode'
  ],

  // 在 <html> 上打 class="dark" / "light"（与 tokens.css 的 :root.light 选择器对应）
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classSuffix: '',
    storage: 'cookie',
    storageKey: 'sd-color-mode',
    // 每个请求都读 cookie，SSR 直接产出正确主题 class（首屏无闪烁的关键）
    emitOnAllHTTPRequests: true
  },

  // 全局样式：设计 token 单一来源（变量 + 基础层），UnoCSS 语义类消费之
  css: ['~/assets/css/tokens.css', '~/assets/css/prose.css'],

  // runtimeConfig：服务端专用（不暴露给浏览器）
  // 环境变量映射：NUXT_API_BASE → apiBase，NUXT_APP_CLIENT_ID → appClientId
  runtimeConfig: {
    // 后端基址：开发默认 localhost:8081，生产经 NUXT_API_BASE 覆盖
    apiBase: 'http://localhost:8081',
    // web 客户端 client_id（docs/blog_s9_web_client.sql），由 .env 注入，仅服务端可见
    appClientId: '',
    // api-decrypt 加密链路密钥（server-only，勿泄漏到浏览器）：请求 RSA 公钥 / 响应 RSA 私钥
    rsaPublicKey: '',
    rsaPrivateKey: '',
    public: {
      siteName: 'Stack Depth'
    }
  },

  // 品牌资源：内嵌 prefers-color-scheme 的 SVG favicon（无需 JS 自动切深浅），ico 兜底老浏览器
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'alternate icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
