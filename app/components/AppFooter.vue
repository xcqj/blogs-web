<script setup lang="ts">
// 全站页脚（design/shell.html 基线 + 增量A 设计化收尾）：品牌名回归 + tagline + © 行 +
// 右侧链接组。只放有真实落点的链接，避免死链；外部/备案位待内容确定后再加。
// 从 12px 单行工具条升级为「designed close」：每页滚到底的最后一印象有签名感。
const siteName = useRuntimeConfig().public.siteName
</script>

<template>
  <footer class="mt-14 border-t border-border bg-surface">
    <div class="sd-wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-6 py-8">
      <!-- 品牌回归：站名（lg 档半加粗 + 标题字距 token）+ tagline + © 行 -->
      <div>
        <div class="text-lg font-bold tracking-[var(--ls-title)]">{{ siteName }}</div>
        <p class="mt-1 text-sm text-muted">把技术一层层读到深处。</p>
        <p class="mt-3 text-xs text-dim">© {{ new Date().getFullYear() }} {{ siteName }}</p>
      </div>
      <nav class="flex gap-6 text-sm text-muted">
        <NuxtLink to="/" class="transition hover:text-primary">首页</NuxtLink>
        <NuxtLink to="/tags" class="transition hover:text-primary">标签</NuxtLink>
        <NuxtLink to="/search" class="transition hover:text-primary">搜索</NuxtLink>
      </nav>
    </div>
  </footer>
</template>
