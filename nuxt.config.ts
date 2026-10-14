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
    '@nuxtjs/color-mode',
    // PWA（S17）：manifest + injectManifest 手写 SW（sw/sw.ts，逐条控制缓存规则）
    '@vite-pwa/nuxt'
  ],

  // PWA（S17）：见 sw/sw.ts 路由规则注释。injectManifest 而非 generateSW 的原因：
  // generateSW 的 navigateFallback 是 SPA app-shell 语义（导航一律回退文档），与 SSR 站
  // 「文章页 SWR + 离线回退页」组合会互相遮蔽；手写 SW 才能让「/me/** 与认证 API
  // 不进缓存」红线逐行可审计。devOptions 关闭：开发期不注册 SW，验收走生产构建
  // （localhost 属 secure context，PWA 可完整开发验收，HTTPS 完整体验归 S13）。
  pwa: {
    strategies: 'injectManifest',
    srcDir: 'sw',
    filename: 'sw.ts',
    registerType: 'autoUpdate',
    devOptions: { enabled: false },
    manifest: {
      name: 'Stack Depth',
      short_name: 'StackDepth',
      description: '多作者技术博客：深度技术文章与讨论',
      lang: 'zh-CN',
      dir: 'ltr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      // 主题色/背景色取 tokens.css 深色 --bg（manifest 为静态单值，深浅切换由 meta theme-color 承担）
      theme_color: '#14120f',
      background_color: '#14120f',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    injectManifest: {
      // app shell 预缓存：构建产物（js/css）+ public 资源（favicon.svg / offline.html / icons）。
      // SSR 站无按路由 html 产物，html 通配实际只命中 offline.html——正是离线回退所需。
      globPatterns: ['**/*.{js,css,html,png,svg}'],
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      // 自定义 manifestTransforms：顶掉 @vite-pwa/nuxt 的生产默认 transform。
      // 默认 transform 面向「预渲染路由页」会把所有 .html 条目改写成无扩展名 URL
      // （offline.html → offline），导致预缓存 404 → SW install 失败被丢弃（redundant、零缓存）。
      // 本站是 SSR 站、唯一 html 就是离线回退页，必须原样保留 URL；同时复刻模块对
      // Nuxt appManifest 的处理：_nuxt/builds/ 下 UUID meta json 去 revision
      // （查询串会使 SW 匹配不到 Nuxt 客户端的无查询请求，离线取不到构建清单）。
      manifestTransforms: [
        async (entries: Array<{ url: string; revision: string | null }>) => {
          const appManifestFolder = '_nuxt/builds/'
          const uuidJson = /(\/)?[0-9a-f]{8}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{4}\b-[0-9a-f]{12}\.json$/i
          for (const e of entries) {
            if (e.url.startsWith(appManifestFolder) && uuidJson.test(e.url)) {
              e.revision = null
            }
          }
          return { manifest: entries, warnings: [] }
        }
      ]
    }
  },

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
  css: ['~/assets/css/tokens.css', '~/assets/css/prose.css', '~/assets/css/transitions.css'],

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
      siteName: 'Stack Depth',
      // 站点对外绝对地址（S17 SEO：sitemap/rss loc、robots Sitemap 行、/post canonical/JSON-LD）
      // dev 默认 localhost:3000；生产经 NUXT_PUBLIC_SITE_URL 覆盖（S13 部署时配真实域名）
      siteUrl: 'http://localhost:3000'
    }
  },

  // 品牌资源与全站 head 基线（M5 SEO：lang 必给，主题色随深浅）
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      link: [
        // 只用 SVG favicon：目标浏览器（桌面各浏览器与 iOS Safari 15+）已全部支持；
        // 旧的 /favicon.ico 是上一代青色位图且本机无光栅化工具可重做，
        // 留着只会让老浏览器显示旧品牌色，故连文件一并移除
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        // iOS 主屏图标（S17）：iOS Safari 不支持 Service Worker，PWA 离线/安装不可用，
        // 但 apple-touch-icon 仍生效（「添加到主屏幕」有品牌图标）；生成脚本 tooling/gen-pwa-icons.mjs
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-180.png' }
      ],
      meta: [
        // 浏览器界面色跟随新色板（与 tokens.css 的 --bg 一致，不可写旧值）
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#14120f' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f4f1ea' }
      ]
    }
  },

  // 部署：显式锁定 node-server 产物（`node .output/server/index.mjs` 直接可跑，容器化用）
  nitro: {
    preset: 'node-server'
  }
})
