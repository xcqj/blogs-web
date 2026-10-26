<script setup lang="ts">
// 全站页脚（design/shell.html 基线 + 增量A 设计化收尾）。
// 方向 C（2026-10-26，D41）：由「三层品牌块」改为单行编辑式收尾——衬线站名 + tagline 一段，
// 右侧等宽大写小字链接 + ©。字距放开是 C 版的收尾签名，不再用 lg 字号品牌名。
// 只放真实落点的链接，不做死链；备案/外链待域名确定后再加。
const siteName = useRuntimeConfig().public.siteName
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-16 border-t border-border bg-surface">
    <div class="sd-wrap flex flex-wrap items-baseline justify-between gap-x-10 gap-y-4 py-8">
      <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="font-serif text-base font-bold tracking-[var(--ls-title)]">{{ siteName }}</span>
        <span class="text-xs text-muted">把技术一层层读到深处。</span>
      </p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-[0.08em] text-muted">
        <NuxtLink to="/" class="transition-colors hover:text-primary-fg">首页</NuxtLink>
        <NuxtLink to="/tags" class="transition-colors hover:text-primary-fg">标签</NuxtLink>
        <NuxtLink to="/search" class="transition-colors hover:text-primary-fg">搜索</NuxtLink>
        <span class="text-dim">© {{ year }}</span>
      </div>
    </div>
  </footer>
</template>
