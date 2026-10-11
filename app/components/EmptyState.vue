<script setup lang="ts">
// 空态（design/states.html ②）：SdState 薄壳——叠框母题图标 + 标题 + 说明 + 操作插槽。
// 全站列表/搜索/标签/用户页复用一套。
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <SdState :title="title" :description="description">
    <template #icon>
      <svg class="mx-auto h-24 w-24" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="6" y="10" width="22" height="22" rx="6" stroke="var(--text-muted)" stroke-width="2" opacity=".5" />
        <rect x="12" y="6" width="22" height="22" rx="6" stroke="var(--accent)" stroke-width="2" />
      </svg>
    </template>
    <template #actions>
      <slot />
    </template>
  </SdState>
</template>
