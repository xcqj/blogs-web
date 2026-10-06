<script setup lang="ts">
// 标签 chip（design .tag / .chip 基线，走 sd-chip token shortcut）
defineProps<{ slug: string; name?: string }>()
</script>

<template>
  <NuxtLink :to="`/tag/${encodeURIComponent(slug)}`" class="sd-chip transition hover:bg-primary hover:text-primary-ink">
    #{{ name || slug }}
  </NuxtLink>
</template>
