<script setup lang="ts">
// 状态徽标：由 status + visibility 推导（契约 §3 语义），四种态各绑一个 token 色。
import type { BlogStatus, BlogVisibility } from '~/types/author'

const props = defineProps<{ status: BlogStatus; visibility: BlogVisibility }>()

const badge = computed(() => {
  if (props.status === '0') return { label: '草稿', cls: 'border-transparent bg-muted-bg text-muted' }
  if (props.visibility === '2') return { label: '管理员下线', cls: 'border-transparent bg-danger-bg text-danger' }
  if (props.visibility === '1') return { label: '已隐藏', cls: 'border-transparent bg-warn-bg text-warn' }
  return { label: '已发布', cls: 'border-[var(--chip-border)] bg-chip text-primary-strong' }
})
</script>

<template>
  <span class="sd-badge" :class="badge.cls">{{ badge.label }}</span>
</template>
