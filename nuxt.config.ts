// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // SSR 前台站：内容页服务端渲染（D28）
  ssr: true,

  modules: [
    // UnoCSS：读取根目录 uno.config.ts，自动注入样式（@unocss/nuxt 内置 virtual css）
    '@unocss/nuxt'
  ],

  // 全局样式：设计 token 单一来源（变量 + 基础层），UnoCSS 语义类消费之
  css: ['~/assets/css/tokens.css'],

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
      siteName: '博客前台'
    }
  }
})
