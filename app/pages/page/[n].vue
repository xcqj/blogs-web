<script setup lang="ts">
import type { ArticleSummary, PageResult } from '~/types/blog'

const route = useRoute()
const pageNum = computed(() => Math.max(1, Number(route.params.n) || 1))
const pageSize = 10

const { data: page } = await useAsyncData(
  `page-articles-${pageNum.value}`,
  () => $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', {
    query: { pageNum: pageNum.value, pageSize }
  }),
  { watch: [pageNum] }
)

const totalPages = computed(() => Math.ceil((page.value?.total ?? 0) / pageSize))
</script>

<template>
  <section class="space-y-3">
    <h1 class="text-xl font-bold">文章列表 · 第 {{ pageNum }} 页</h1>
    <ArticleCard v-for="a in page?.rows" :key="a.articleId" :article="a" />
    <p v-if="!page?.rows?.length" class="py-10 text-center text-sm text-gray-400">暂无文章</p>

    <nav class="flex items-center justify-center gap-3 pt-4 text-sm">
      <NuxtLink v-if="pageNum > 1" :to="`/page/${pageNum - 1}`" class="rounded border px-3 py-1 hover:border-primary">
        上一页
      </NuxtLink>
      <span class="text-gray-400">{{ pageNum }} / {{ totalPages }}</span>
      <NuxtLink v-if="pageNum < totalPages" :to="`/page/${pageNum + 1}`" class="rounded border px-3 py-1 hover:border-primary">
        下一页
      </NuxtLink>
    </nav>
  </section>
</template>
