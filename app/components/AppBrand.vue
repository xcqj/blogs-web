<template>
  <!-- 品牌：错位叠框母题（Stack）+ 前框发光（Depth）。必须内联 SVG，
       两条 path 各绑主题变量，深浅切换自动变色（不能用 <img>，那样颜色被烤死）。 -->
  <NuxtLink to="/" class="flex min-w-0 items-center gap-2.5 font-bold sm:gap-3">
    <svg
      class="h-8 w-8 shrink-0 drop-shadow-[0_0_6px_var(--glow)]"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect x="6" y="10" width="22" height="22" rx="6" stroke="var(--logo-back)" stroke-width="2.6" />
      <rect x="12" y="6" width="22" height="22" rx="6" stroke="var(--logo-front)" stroke-width="2.6" />
    </svg>
    <span class="min-w-0 truncate text-lg">{{ siteName }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
const siteName = useRuntimeConfig().public.siteName
</script>
