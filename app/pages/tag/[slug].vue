<script setup lang="ts">
import type { ArticleSummary, PageResult } from '~/types/blog'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const pageSize = 10

const { data: page } = await useAsyncData(
  `tag-articles-${slug.value}`,
  () => $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', {
    query: { pageNum: 1, pageSize, tagSlug: decodeURIComponent(slug.value) }
  }),
  { watch: [slug] }
)

useSeoMeta({ title: () => `标签 · ${decodeURIComponent(slug.value)}` })
</script>

<template>
  <section class="space-y-3">
    <h1 class="text-xl font-bold">标签：{{ decodeURIComponent(slug) }}</h1>
    <ArticleCard v-for="a in page?.rows" :key="a.articleId" :article="a" />
    <p v-if="!page?.rows?.length" class="py-10 text-center text-sm text-gray-400">该标签下暂无公开文章</p>
  </section>
</template>
