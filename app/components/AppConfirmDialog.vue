<script setup lang="ts">
// 阻断式确认框（质感打磨轮 L3）：全站唯一实例，挂在 app.vue，由 useConfirm() 驱动。
// 只用于不可逆/破坏性操作；必须说清「删哪条、会发生什么」，不许只问「确定吗」。
import { settleConfirm, useFeedbackState } from '~/composables/useFeedback';
import { useModalA11y } from '~/composables/useModalA11y';

const { pending } = useFeedbackState();
const rootEl = ref<HTMLElement>();

const isOpen = () => !!pending.value;

useModalA11y({
  isOpen,
  container: () => rootEl.value,
  onClose: () => settleConfirm(false)
});
</script>

<template>
  <!-- 遮罩淡入（Transition）+ 面板弹出（CSS 动画），不对全屏遮罩做缩放 -->
  <Transition name="sd-fade">
    <div v-if="pending" class="sd-scrim z-60 grid place-items-center p-5" @click.self="settleConfirm(false)">
    <div
      ref="rootEl"
      class="sd-pop-in w-full max-w-[420px] rounded-lg bg-elevated p-5 shadow-e3"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`confirm-${pending.options.title}`"
    >
      <h2 :id="`confirm-${pending.options.title}`" class="text-lg font-bold tracking-[var(--ls-title)]">
        {{ pending.options.title }}
      </h2>
      <p v-if="pending.options.body" class="mt-2 text-sm text-muted">
        {{ pending.options.body }}
      </p>
      <!-- 操作对象单独成块：确认的是具体那一条，不是一句抽象问句 -->
      <p v-if="pending.options.target" class="mt-3.5 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
        {{ pending.options.target }}
      </p>
      <div class="mt-5 flex justify-end gap-2">
        <button class="btn-secondary" @click="settleConfirm(false)">
          {{ pending.options.cancelText || '取消' }}
        </button>
        <button
          :class="pending.options.danger ? 'btn-danger' : 'btn-primary'"
          data-autofocus
          @click="settleConfirm(true)"
        >
          {{ pending.options.confirmText || '确认' }}
        </button>
      </div>
    </div>
    </div>
  </Transition>
</template>
