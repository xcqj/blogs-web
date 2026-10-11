<script setup lang="ts">
// 基础状态展示（空态/错误态统一骨架）：icon 插槽 + 标题 + 说明 + actions 插槽。
// EmptyState / ErrorState 是它的两个薄壳（各自带图标母题），页面无需感知差异。
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <div class="py-10 text-center">
    <slot name="icon" />
    <h4 class="mt-4 text-lg font-bold tracking-[var(--ls-title)]">{{ title }}</h4>
    <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
