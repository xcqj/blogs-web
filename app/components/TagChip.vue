<script setup lang="ts">
defineProps<{ slug: string; name?: string }>()
</script>

<template>
  <NuxtLink
    :to="`/tag/${encodeURIComponent(slug)}`"
    class="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-primary hover:text-white"
  >
    #{{ name || slug }}
  </NuxtLink>
</template>
