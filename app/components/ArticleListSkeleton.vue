<script setup lang="ts">
// 列表骨架屏（方向 C，S23-T15）：行式骨架，尺寸贴近 PostRow —— 左三层文字 + 右 132×76 图位。
// 与真实行结构对齐才能防数据到达时的布局跳动；shimmer 属加载态非装饰动效。
withDefaults(defineProps<{ count?: number }>(), { count: 4 })
</script>

<template>
  <div role="status" aria-busy="true" aria-label="加载中">
    <div v-for="i in count" :key="i" class="flex items-start gap-5 border-b border-border py-4">
      <div class="min-w-0 flex-1 space-y-2.5">
        <div class="sk h-4" :style="{ width: i % 2 ? '58%' : '46%' }" />
        <div class="sk h-3" :style="{ width: i % 2 ? '82%' : '70%' }" />
        <div class="sk h-3 w-1/3" />
      </div>
      <div class="sk hidden h-[76px] w-[132px] shrink-0 sm:block" />
    </div>
  </div>
</template>

<style scoped>
.sk {
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--border) 25%, var(--surface) 37%, var(--border) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s infinite linear;
}
@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sk {
    animation: none;
  }
}
</style>
