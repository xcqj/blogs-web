<script setup lang="ts">
// 全站页脚（design/shell.html 基线）：只放有真实落点的链接，避免死链；外部/备案位待内容确定后再加。
const siteName = useRuntimeConfig().public.siteName
</script>

<template>
  <footer class="mt-14 border-t border-border bg-surface">
    <div class="sd-wrap flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-muted">
      <div>© {{ new Date().getFullYear() }} {{ siteName }} · 把技术一层层读到深处</div>
      <nav class="flex gap-4">
        <NuxtLink to="/tags" class="transition hover:text-primary">标签</NuxtLink>
        <NuxtLink to="/search" class="transition hover:text-primary">搜索</NuxtLink>
      </nav>
    </div>
  </footer>
</template>
