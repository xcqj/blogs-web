<script setup lang="ts">
// 全站页脚（方向 C，按 Stitch「首页1.1」HTML 逐项校准 2026-10-27）。
// 结构：左栏两行（站名 22px 衬线 + "/" + tagline 13px；下一行 © 12px 等宽）+ 右侧三项导航。
// 关键数值全部来自 HTML 实测：站名 headline-sm 22px、tagline body-sm 13px、© label-mono 12px、nav 13px/gap-8。
// 早期实现把 © 塞进右侧链接组、站名只有 18px、缺 "/" 分隔符——这是与设计稿对不上的直接原因。
const siteName = useRuntimeConfig().public.siteName
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-16 border-t border-border bg-surface">
    <div
      class="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-6 py-10 md:flex-row md:items-baseline md:justify-between lg:px-12"
    >
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-serif text-[22px] font-bold tracking-[var(--ls-title)]">{{ siteName }}</span>
          <span class="font-mono text-xs text-dim" aria-hidden="true">/</span>
          <p class="m-0 text-[13px] text-muted">把技术一层层读到深处。</p>
        </div>
        <div class="mt-1 font-mono text-xs text-dim">© {{ year }} {{ siteName }}. All rights reserved.</div>
      </div>

      <nav class="flex items-center gap-8 text-[13px]" aria-label="页脚导航">
        <NuxtLink to="/" class="font-semibold text-text transition-colors hover:text-primary-fg">首页</NuxtLink>
        <NuxtLink to="/tags" class="text-muted transition-colors hover:text-text">标签</NuxtLink>
        <NuxtLink to="/search" class="text-muted transition-colors hover:text-text">搜索</NuxtLink>
        <NuxtLink to="/about" class="text-muted transition-colors hover:text-text">关于</NuxtLink>
      </nav>
    </div>
  </footer>
</template>
