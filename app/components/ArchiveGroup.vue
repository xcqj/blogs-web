<script setup lang="ts">
// 归档分组（首页 / /page/{n} 左栏共用，jason.blog 年月归档语义）：
// 组头 = 年月标签 + 篇数 + 右侧发丝线；组内沿用 ArticleCard 行式卡片（2026-10-08 已定稿形态）。
// h3 语义：页面 h1/h2 已由页头与「最新文章」标题占用。
defineProps<{ label: string; count: number }>()
</script>

<template>
  <section>
    <h3 class="sd-archive-head mb-3">
      <span>{{ label }}</span>
      <span class="text-xs font-normal text-dim">{{ count }} 篇</span>
      <span class="h-px flex-1 bg-border" aria-hidden="true" />
    </h3>
    <div class="space-y-4">
      <slot />
    </div>
  </section>
</template>
