<script setup lang="ts">
// Toast 出口（质感打磨轮 L3）：全站唯一实例，挂在 app.vue。
// 规则来自 useFeedback：同 key 合并、最多 3 条、错误类不自动消失（必须手动关）。
import { useFeedbackState, useToast } from '~/composables/useFeedback';

const { toasts } = useFeedbackState();
const { dismiss } = useToast();

/** 左侧色条按语义取 token，不写死颜色 */
function barClass(kind: string) {
  return kind === 'err' ? 'border-l-danger' : kind === 'info' ? 'border-l-warn' : 'border-l-primary';
}
</script>

<template>
  <div class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,340px)] flex-col gap-2.5 sm:right-6 sm:bottom-6">
    <div
      v-for="t in toasts"
      :key="t.id"
      :class="['sd-toast pointer-events-auto flex items-start gap-2.5 border-l-3 border-border bg-elevated p-3 shadow-e3', barClass(t.kind), t.leaving ? 'is-out' : '']"
      role="status"
      :aria-live="t.kind === 'err' ? 'assertive' : 'polite'"
    >
      <span :class="['mt-0.5 shrink-0', t.kind === 'err' ? 'i-mdi:alert-circle text-danger' : 'i-mdi:check-circle text-primary']" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">{{ t.title }}</p>
        <p v-if="t.desc" class="mt-0.5 text-xs text-dim">{{ t.desc }}</p>
      </div>
      <NuxtLink
        v-if="t.action?.to"
        :to="t.action.to"
        class="sd-toast-act"
        @click="dismiss(t.id)"
      >{{ t.action.label }}</NuxtLink>
      <button
        v-else-if="t.action"
        class="sd-toast-act"
        @click="t.action.run?.(); dismiss(t.id)"
      >{{ t.action.label }}</button>
      <button class="sd-toast-x" aria-label="关闭提示" @click="dismiss(t.id)">
        <span class="i-mdi:close" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 进场 280ms ease-out、离场 200ms ease-in-out：与 token 时长一致，离场更快不拖沓 */
.sd-toast {
  border-radius: var(--radius-lg);
  animation: sd-toast-in var(--t-slow) var(--ease-out);
}
.sd-toast.is-out {
  animation: sd-toast-out var(--t) var(--ease-inout) forwards;
}
@keyframes sd-toast-in {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: none; }
}
@keyframes sd-toast-out {
  to { opacity: 0; transform: translateX(16px); }
}
@media (prefers-reduced-motion: reduce) {
  .sd-toast,
  .sd-toast.is-out {
    animation: none;
  }
}
</style>
