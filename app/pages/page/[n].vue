<script setup lang="ts">
// /page/{n} —— 文章分页列表（§5.1）。2026-10-13：与首页左栏同构——按年月归档分组，
// 页尾补 CTA band 收尾。数字分页见 AppPagination；容器沿用布局宽档。
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

// 按 publishedAt 年月归档分组（与首页左栏同构；只对当前页分组，不跨页聚合）
const archiveGroups = computed(() => groupByMonth(data.value?.rows ?? []))

useSeoMeta({ title: () => `文章列表 第 ${page.value} 页` })
</script>

<template>
  <div class="space-y-8">
    <section>
      <header class="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h1 class="text-2xl font-bold tracking-[var(--ls-h2)]">最新文章</h1>
        <p class="text-sm text-muted">共 {{ data?.total ?? 0 }} 篇 · 第 {{ page }} 页</p>
      </header>

      <ArticleListSkeleton v-if="status === 'pending'" :count="4" />
      <ErrorState v-else-if="status === 'error'" description="文章加载失败，请稍后重试。">
        <SdButton @click="refresh">重试</SdButton>
      </ErrorState>
      <template v-else>
        <div v-if="archiveGroups.length" class="space-y-6">
          <ArchiveGroup v-for="g in archiveGroups" :key="g.key" :label="g.label" :count="g.items.length">
            <ArticleCard v-for="a in g.items" :key="a.articleId" :article="a" />
          </ArchiveGroup>
        </div>
        <EmptyState v-else-if="!data?.rows?.length" title="还没有文章" description="稍后再来看看。" />
        <AppPagination :page="page" :total="data?.total ?? 0" :page-size="pageSize" :link-for="(n) => `/page/${n}`" />
      </template>
    </section>

    <CtaBand />
  </div>
</template>
