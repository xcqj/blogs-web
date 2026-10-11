<script setup lang="ts">
// 基础徽章：封装 sd-badge shortcut，五档 tone 绑定既有语义色 token（与 StatusBadge 同源）。
// soft = 正面态（与 chip 同族三件套）；neutral/warn/danger 对应草稿/隐藏/下线。
interface Props {
  tone?: 'soft' | 'neutral' | 'warn' | 'danger' | 'outline'
}

withDefaults(defineProps<Props>(), { tone: 'neutral' })

const toneCls: Record<NonNullable<Props['tone']>, string> = {
  soft: 'border-transparent bg-soft text-primary-fg',
  neutral: 'border-transparent bg-muted-bg text-muted',
  warn: 'border-transparent bg-warn-bg text-warn',
  danger: 'border-transparent bg-danger-bg text-danger',
  outline: 'border-border-strong text-muted'
}
</script>

<template>
  <span class="sd-badge" :class="toneCls[tone]"><slot /></span>
</template>
