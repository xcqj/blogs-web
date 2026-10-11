<script setup lang="ts">
// 错误态（design/states.html ③）：SdState 薄壳——感叹圈图标 + 标题 + 说明 + 操作插槽（重试/返回）。
withDefaults(defineProps<{ title?: string; description?: string }>(), { title: '加载失败' })
</script>

<template>
  <SdState :title="title" :description="description">
    <template #icon>
      <svg class="mx-auto h-20 w-20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="var(--accent)" stroke-width="2" />
        <path d="M12 7v6M12 16.5v.5" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
      </svg>
    </template>
    <template #actions>
      <slot />
    </template>
  </SdState>
</template>
