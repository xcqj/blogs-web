<script setup lang="ts">
// /page/{n} —— 文章分页列表（§5.1）。方向 C（S23-T18）：
// 与首页同一套版式语言——编号小字 + 衬线标题 + PostRow 数据行；
// **取消按年月归档分组**（首页已无分组，翻页再带分组头会突兀；时间信息由行内日期列承担）。
// 首页第 1 页是特例（带 LATEST 头条），本页从第 2 页起全是数据行。
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

const rows = computed(() => data.value?.rows ?? [])

useSeoMeta({ title: () => `文章列表 第 ${page.value} 页` })
</script>

<template>
  <div class="space-y-12">
    <section>
      <header class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-6">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">01 // ARCHIVE</p>
          <h1 class="mt-3 font-serif text-2xl font-bold tracking-[var(--ls-h1)] md:text-3xl">最新文章</h1>
        </div>
        <p class="font-mono text-xs uppercase tracking-[0.08em] text-dim">
          共 {{ data?.total ?? 0 }} 篇 · 第 {{ page }} 页
        </p>
      </header>

      <ArticleListSkeleton v-if="status === 'pending'" class="mt-6" :count="4" />
      <ErrorState v-else-if="status === 'error'" class="mt-6" description="文章加载失败，请稍后重试。">
        <SdButton @click="refresh">重试</SdButton>
      </ErrorState>
      <template v-else>
        <div v-if="rows.length" class="mt-2">
          <PostRow v-for="a in rows" :key="a.articleId" :article="a" />
        </div>
        <EmptyState v-else class="mt-10" title="还没有文章" description="稍后再来看看。" />
        <AppPagination
          class="mt-8"
          :page="page"
          :total="data?.total ?? 0"
          :page-size="pageSize"
          :link-for="(n) => `/page/${n}`"
        />
      </template>
    </section>

    <CtaBand />
  </div>
</template>
