<script setup lang="ts">
// /search —— 搜索路由骨架。待接：§6 GET /blog/public/search（keyword + 分页），命中结果复用 ArticleCard。
const keyword = ref('')
function onSearch() {
  // 提交后应导航到 /search?keyword=... 并 SSR 取数，属后续页面实现
}
</script>

<template>
  <section class="rounded-lg border border-gray-100 bg-white p-6">
    <h1 class="text-xl font-bold">搜索</h1>
    <form class="mt-3 flex max-w-md gap-2" @submit.prevent="onSearch">
      <input v-model="keyword" type="search" placeholder="输入关键词" class="flex-1 rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary" />
      <button type="submit" class="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90">搜索</button>
    </form>
    <p class="mt-4 text-sm text-gray-400">搜索结果区骨架已就位（§6 待接入）。</p>
  </section>
</template>
