<script setup lang="ts">
// 空态（design/states.html ②）：SdState 薄壳——叠框母题图标 + 标题 + 说明 + 操作插槽。
// 全站列表/搜索/标签/用户页复用一套。
// icon-class：窄栏场景（如详情页 68ch 评论区）传 h-16 缩小图标，避免头重脚轻；
// 宽栏列表页用默认 h-24。默认值不变，既有调用点零改动。
withDefaults(defineProps<{ title: string; description?: string; iconClass?: string }>(), {
  iconClass: 'h-24 w-24'
})
</script>

<template>
  <SdState :title="title" :description="description">
    <template #icon>
      <svg class="mx-auto" :class="iconClass" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="6" y="10" width="22" height="22" rx="6" stroke="var(--text-muted)" stroke-width="2" opacity=".5" />
        <rect x="12" y="6" width="22" height="22" rx="6" stroke="var(--accent)" stroke-width="2" />
      </svg>
    </template>
    <template #actions>
      <slot />
    </template>
  </SdState>
</template>
