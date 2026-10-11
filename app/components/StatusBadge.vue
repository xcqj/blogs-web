<script setup lang="ts">
// 状态徽标：由 status + visibility 推导（契约 §3 语义），四种态映射到 SdBadge 的 tone。
import type { BlogStatus, BlogVisibility } from '~/types/author'

const props = defineProps<{ status: BlogStatus; visibility: BlogVisibility }>()

const badge = computed(() => {
  if (props.status === '0') return { label: '草稿', tone: 'neutral' as const }
  if (props.visibility === '2') return { label: '管理员下线', tone: 'danger' as const }
  if (props.visibility === '1') return { label: '已隐藏', tone: 'warn' as const }
  // 已发布是正面态：soft 三件套（与 chip 同族），不再拉边框
  return { label: '已发布', tone: 'soft' as const }
})
</script>

<template>
  <SdBadge :tone="badge.tone">{{ badge.label }}</SdBadge>
</template>
