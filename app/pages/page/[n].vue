<script setup lang="ts">
// /page/{n} —— 文章分页列表（§5.1）。数字分页见 AppPagination；容器沿用布局宽档。
import type { ArticleSummary, PageResult } from '~/types/blog'

const route = useRoute()
const page = computed(() => Math.max(1, Number(route.params.n) || 1))
const pageSize = 10

const { data, status, refresh } = await useAsyncData(
  `page-articles-${page.value}`,
  () =>
    $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', {
      query: { pageNum: page.value, pageSize }
    }),
  { watch: [page] }
)

useSeoMeta({ title: () => `文章列表 第 ${page.value} 页` })
</script>

<template>
  <section>
    <header class="mb-5 flex flex-wrap items-baseline justify-between gap-3">
      <h1 class="text-2xl font-bold tracking-[var(--ls-h2)]">最新文章</h1>
      <p class="text-sm text-muted">共 {{ data?.total ?? 0 }} 篇 · 第 {{ page }} 页</p>
    </header>

    <ArticleListSkeleton v-if="status === 'pending'" :count="4" />
    <ErrorState v-else-if="status === 'error'" description="文章加载失败，请稍后重试。">
      <button class="btn-primary" @click="refresh">重试</button>
    </ErrorState>
    <template v-else>
      <div class="space-y-3.5">
        <ArticleCard v-for="a in data?.rows" :key="a.articleId" :article="a" />
      </div>
      <EmptyState v-if="!data?.rows?.length" title="还没有文章" description="稍后再来看看。" />
      <AppPagination :page="page" :total="data?.total ?? 0" :page-size="pageSize" :link-for="(n) => `/page/${n}`" />
    </template>
  </section>
</template>
