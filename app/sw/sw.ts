// S17 Service Worker（@vite-pwa/nuxt injectManifest 手写模式，构建时由 workbox-build 注入
// self.__WB_MANIFEST 预缓存清单）。本文件只在 SW 上下文执行，不涉 SSR。
// 位置约定：Nuxt 4 的 srcDir 是 app/，@vite-pwa/nuxt 的 srcDir:'sw' 解析为 app/sw。
//
// ┌─ 缓存策略总览（顺序即优先级，workbox 首条匹配路由生效）──────────────────┐
// │ ① precacheAndRoute：app shell 预缓存（构建 js/css + public：favicon/offline.html/图标） │
// │ ② 文档导航 SWR：白名单 / /page/ /post/ /tag/ /tags/ /user/（见 CONTENT_NAV）        │
// │    ——白名单构造天然排除 /me/**、/register、/social-callback（红线：作者中心不进缓存）  │
// │ ③ /api/blog/public/** NetworkFirst：公共数据（匿名，无登录态）                        │
// │ ④ 其余请求（含 /api/blog/article|user|auth|resource/**、/me/** 文档）不注册规则：     │
// │    浏览器直连网络，请求 cookie 与响应一律不进缓存（红线：需登录 API 不进 SW 缓存）     │
// └──────────────────────────────────────────────────────────────────────────┘
// 与 Nitro 代理的兼容性：SW 只拦截浏览器同源请求；SSR 期服务端→后端的调用对 SW 不可见。
// 离线回退：内容页 SWR 挂 handlerDidError，缓存未命中且离线时回退 /offline.html（已预缓存）。

import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// ① app shell 预缓存
precacheAndRoute(self.__WB_MANIFEST)

// ② 内容页导航白名单（SWR）。红线的实现方式=白名单而非黑名单：
// 只有这些前缀的文档导航进缓存，/me/** 等不在列即直通网络，从构造上杜绝误缓存。
const CONTENT_NAV = ({ request, url }: { request: Request; url: URL }) =>
  request.destination === 'document' &&
  (url.pathname === '/' || /^\/(page|post|tag|tags|user)\//.test(url.pathname))

// 公共 API 前缀（匿名数据，可缓存）。需登录的 /api/blog/article|user|auth|resource 故意不在内。
const PUBLIC_API_PREFIX = '/api/blog/public/'

// 离线回退插件：策略整体失败（离线且无缓存）时回退预缓存的 /offline.html
const offlineFallback = {
  handlerDidError: async () => (await self.caches.match('/offline.html')) ?? Response.error()
}

const okResponse = new CacheableResponsePlugin({ statuses: [0, 200] })

// ② 内容页：stale-while-revalidate（先给缓存保证秒开，后台静默更新）
registerRoute(
  CONTENT_NAV,
  new StaleWhileRevalidate({
    cacheName: 'sd-pages',
    plugins: [
      okResponse,
      offlineFallback,
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 })
    ]
  })
)

// ③ 公共 API：network-first（在线取新，离线才回落缓存）
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith(PUBLIC_API_PREFIX),
  new NetworkFirst({
    cacheName: 'sd-public-api',
    networkTimeoutSeconds: 3,
    plugins: [
      okResponse,
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 })
    ]
  })
)
