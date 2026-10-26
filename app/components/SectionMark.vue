<script setup lang="ts">
// 区块编号条（方向 C，S23；按 Stitch 首页 HTML 校准 2026-10-27）：
// `02 // 最新文章` 整体是**一行等宽小字 label**，不是"编号 + 衬线大标题"——
// 早期实现把它做成了 h2 衬线标题，与设计稿差得最明显的一处。
// 右侧用 #right 插槽放计数 / "更早文章 →"，底线 1px 收束。
defineProps<{ index: string; title: string; id?: string }>()
</script>

<template>
  <div :id="id" class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
    <!-- Stitch 口径：label-mono 12px + 主文字色 + medium（不是次级灰，也小一号于 13px） -->
    <span class="font-mono text-[12px] font-medium tracking-[0.08em] text-text">
      {{ index }} // {{ title }}
    </span>
    <slot name="right" />
  </div>
</template>
