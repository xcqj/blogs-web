import { defineConfig } from 'vitest/config'

// 只测无 DOM 依赖的纯函数工具（toc / codeBlock / imageCompress 的跳过分支）。
// 因此用 node 环境、不加载 Nuxt 插件与 alias——三个被测模块都没有 `~/` 导入。
// canvas 缩放那类需要 DOM 的路径不在这里测，由 shot.mjs 的页面回归与人工验收覆盖。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['app/**/*.spec.ts']
  }
})
