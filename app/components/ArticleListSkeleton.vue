<script setup lang="ts">
// 列表骨架屏（design/states.html ①）：占位尺寸贴近真实卡片，防数据到达前布局跳动。
// 全站唯一加载态组件；动效仅为 shimmer 占位，非装饰动效（桶B）。
withDefaults(defineProps<{ count?: number }>(), { count: 3 })
</script>

<template>
  <div class="space-y-3.5" role="status" aria-busy="true" aria-label="加载中">
    <div v-for="i in count" :key="i" class="sk-card">
      <div class="sk sk-title" :style="{ width: i % 2 ? '60%' : '48%' }" />
      <div class="sk sk-line" />
      <div class="sk sk-line" :style="{ width: i % 2 ? '40%' : '55%' }" />
      <div class="mt-3 flex gap-2">
        <span class="sk sk-chip" />
        <span class="sk sk-chip" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sk-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: var(--space-4);
}
.sk {
  border-radius: 6px;
  background: linear-gradient(90deg, var(--border) 25%, var(--surface) 37%, var(--border) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s infinite linear;
}
.sk-title {
  height: 20px;
  margin-bottom: var(--space-3);
}
.sk-line {
  height: 12px;
  width: 100%;
  margin-bottom: var(--space-2);
}
.sk-chip {
  display: inline-block;
  height: 18px;
  width: 60px;
  border-radius: var(--radius-full);
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
