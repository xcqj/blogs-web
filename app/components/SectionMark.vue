<script setup lang="ts">
// 区块编号锚点（方向 C，2026-10-26 / S23-T15）：`01 // 最新文章`
// 编号等宽大写 + 主色，标题衬线；右侧用 #right 插槽放计数/更多链接。
// 编号只是版式序号（不是刊期/卷号这类真实数据），跳转目标由外层 id 承担。
defineProps<{ index: string; title: string; id?: string }>()
</script>

<template>
  <div :id="id" class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <span class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">{{ index }}</span>
    <span class="text-xs text-dim" aria-hidden="true">//</span>
    <h2 class="font-serif text-xl font-bold tracking-[var(--ls-h2)]">{{ title }}</h2>
    <slot name="right" />
  </div>
</template>
