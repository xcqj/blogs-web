<script setup lang="ts">
// /post/{slug} —— 文章详情路由骨架。契约 §1.4：文章 slug 为预留字段，MVP 主路由承载 articleId。
// 待接：§5.2 GET /blog/public/articles/{id}（正文 prose 渲染 + viewCount）、§10.1 评论列表、§10.2 评论发表(CSR)。
const route = useRoute()
const articleId = computed(() => String(route.params.slug || ''))
</script>

<template>
  <section class="rounded-lg border border-gray-100 bg-white p-6">
    <h1 class="text-xl font-bold">文章详情</h1>
    <p class="mt-2 text-sm text-gray-500">
      文章 ID：<code>{{ articleId }}</code>
    </p>
    <p class="mt-4 text-sm text-gray-400">
      详情页骨架已就位（§5.2 正文 / §10.1 评论 / §10.2 发表评论 待接入）。
    </p>
  </section>
</template>
