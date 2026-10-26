<script setup lang="ts">
// 页面收尾行动区（方向 C，S23；按 Stitch 首页 HTML 校准 2026-10-27）。
// 2px 深色横线起头 + 编号小字（首页为 03 // CONTRIBUTION）+ 衬线标题（末尾靛蓝方块）。
// 编号由调用方传（各页序号不同）；不传则不显示编号条。
// 黄 CTA 已作废（D41），主行动按钮统一 --accent 实底。
withDefaults(defineProps<{ index?: string; label?: string }>(), { index: '', label: '' })
</script>

<template>
  <section v-reveal class="mt-20 border-t-2 border-text pt-12 pb-16">
    <div class="flex max-w-[760px] flex-col">
      <p v-if="index" class="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
        {{ index }} // {{ label }}
      </p>
      <h2 class="font-serif text-[2rem] font-bold tracking-[var(--ls-h2)] sm:text-[2.25rem]">
        下一篇，从你开始<span class="ml-1.5 inline-block h-2.5 w-2.5 align-baseline bg-primary" />
      </h2>
      <p class="mt-4 text-[17px] leading-[1.75] text-muted">
        无论是对内存泄漏的深渊攻坚，还是对底层算法原生实现的高清复盘。严谨记录，拒绝浮躁。
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <SdButton to="/me/new" class="px-7 py-3.5">开始写作 →</SdButton>
        <SdButton to="/tags" variant="secondary" class="px-7 py-3.5">逛标签</SdButton>
      </div>
    </div>
  </section>
</template>
