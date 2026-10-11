<script setup lang="ts">
// 错误态（design/states.html ③）：感叹圈图标 + 标题 + 说明 + 操作插槽（重试/返回）。
defineProps<{ title?: string; description?: string }>()
</script>

<template>
  <div class="py-10 text-center">
    <svg class="mx-auto h-20 w-20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--accent)" stroke-width="2" />
      <path d="M12 7v6M12 16.5v.5" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
    </svg>
    <h4 class="mt-4 text-lg font-bold tracking-[var(--ls-title)]">{{ title || '加载失败' }}</h4>
    <p v-if="description" class="mt-1 text-sm text-muted">{{ description }}</p>
    <div class="mt-5 flex flex-wrap items-center justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
