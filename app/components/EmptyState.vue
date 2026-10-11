<script setup lang="ts">
// 空态（design/states.html ②）：叠框母题图标 + 标题 + 说明 + 操作插槽。全站列表/搜索/标签/用户页复用一套。
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="py-10 text-center">
    <svg class="mx-auto h-24 w-24" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="22" height="22" rx="6" stroke="var(--text-muted)" stroke-width="2" opacity=".5" />
      <rect x="12" y="6" width="22" height="22" rx="6" stroke="var(--accent)" stroke-width="2" />
    </svg>
    <h4 class="mt-4 text-lg font-bold tracking-[var(--ls-title)]">{{ title }}</h4>
    <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
