<template>
  <!-- 品牌：错位叠框母题（Stack）+ 前框着色（Depth）。必须内联 SVG，
       两条 path 各绑主题变量，深浅切换自动变色（不能用 <img>，那样颜色被烤死）。
       方向 C（2026-10-26）：去掉外发光（C 版无 glow 机制）；rx 6→2.5 与全站 3px 圆角族对齐；
       站名改衬线（--font-serif，仅品牌与标题用，不进正文）。 -->
  <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5 sm:gap-3">
    <svg class="h-8 w-8 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="22" height="22" rx="2.5" stroke="var(--logo-back)" stroke-width="2.6" />
      <rect x="12" y="6" width="22" height="22" rx="2.5" stroke="var(--logo-front)" stroke-width="2.6" />
    </svg>
    <span class="min-w-0 truncate font-serif text-lg font-bold tracking-[var(--ls-title)]">{{ siteName }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const siteName = useRuntimeConfig().public.siteName
</script>
