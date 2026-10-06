<script setup lang="ts">
// /user/{userId} —— 作者主页路由骨架。待接：§9.1 GET /blog/public/users/{userId}（公开资料）、
// §9.2 GET /blog/public/users/{userId}/articles（其公开文章，可复用 §5.1 authorId 参数）。
const route = useRoute()
const userId = computed(() => String(route.params.userId || ''))
</script>

<template>
  <section class="rounded-lg border border-gray-100 bg-white p-6">
    <h1 class="text-xl font-bold">用户主页</h1>
    <p class="mt-2 text-sm text-gray-500">用户 ID：<code>{{ userId }}</code></p>
    <p class="mt-4 text-sm text-gray-400">作者主页骨架已就位（§9.1 资料 / §9.2 公开文章 待接入）。</p>
  </section>
</template>
