<script setup lang="ts">
// /tag/{slug} —— 标签下公开文章（§5.1 tagSlug 过滤；alias→canonical 的 301 由 server/middleware 处理）。
import type { ArticleSummary, PageResult } from '~/types/blog'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const slugText = computed(() => decodeURIComponent(slug.value))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const pageSize = 10

const { data, status, refresh } = await useAsyncData(
  `tag-articles-${slug.value}-${page.value}`,
  () =>
    $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', {
      query: { pageNum: page.value, pageSize, tagSlug: slugText.value }
    }),
  { watch: [slug, page] }
)

useSeoMeta({
  title: () => `标签 · ${slugText.value}`,
  description: () => `标签「${slugText.value}」下的公开文章列表。`,
  ogTitle: () => `标签 · ${slugText.value}`,
  ogDescription: () => `标签「${slugText.value}」下的公开文章列表。`,
  ogType: 'website'
})
</script>

<template>
  <section>
    <header class="mb-5 flex flex-wrap items-baseline justify-between gap-3">
      <h1 class="text-2xl font-bold tracking-[var(--ls-h2)]">
        <span class="text-primary">#</span>{{ slugText }}
      </h1>
      <p class="text-sm text-muted">共 {{ data?.total ?? 0 }} 篇</p>
    </header>

    <ArticleListSkeleton v-if="status === 'pending'" :count="4" />
    <ErrorState v-else-if="status === 'error'" description="文章加载失败，请稍后重试。">
      <SdButton @click="refresh">重试</SdButton>
    </ErrorState>
    <template v-else>
      <div class="space-y-3.5">
        <ArticleCard v-for="a in data?.rows" :key="a.articleId" :article="a" />
      </div>
      <EmptyState
        v-if="!data?.rows?.length"
        title="该标签下暂无公开文章"
        description="换个标签看看，或回到全部文章。"
      >
        <SdButton to="/tags" variant="ghost" class="mt-1">全部标签</SdButton>
      </EmptyState>
      <AppPagination
        :page="page"
        :total="data?.total ?? 0"
        :page-size="pageSize"
        :link-for="(n) => ({ path: `/tag/${slug}`, query: n > 1 ? { page: n } : {} })"
      />
    </template>
  </section>
</template>
