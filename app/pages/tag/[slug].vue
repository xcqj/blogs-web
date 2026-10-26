<script setup lang="ts">
// /tag/{slug} —— 标签下公开文章（§5.1 tagSlug 过滤；alias→canonical 的 301 由 server/middleware 处理）。
// 方向 C（S23-T17）：列表改用 PostRow 数据行；**取消按月归档分组**（与首页一致，
// 时间信息由行内日期列承担，分组头在 C 版是多余的层级）。
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

// 显式收窄成数组：模板里 data?.rows?.length 为真也未必能让 TS 收窄，v-for 直接读会报 possibly undefined
const rows = computed(() => data.value?.rows ?? [])

useSeoMeta({
  title: () => `标签 · ${slugText.value}`,
  description: () => `标签「${slugText.value}」下的公开文章列表。`,
  ogTitle: () => `标签 · ${slugText.value}`,
  ogDescription: () => `标签「${slugText.value}」下的公开文章列表。`,
  ogType: 'website'
})
</script>

<template>
  <div class="space-y-12">
    <section>
      <header class="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-6">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">01 // TAG</p>
          <h1 class="mt-3 font-serif text-2xl font-bold tracking-[var(--ls-h1)] md:text-3xl">
            <span class="text-primary-fg">#</span>{{ slugText }}
          </h1>
        </div>
        <p class="font-mono text-xs uppercase tracking-[0.08em] text-dim">共 {{ data?.total ?? 0 }} 篇</p>
      </header>

      <ArticleListSkeleton v-if="status === 'pending'" class="mt-6" :count="4" />
      <ErrorState v-else-if="status === 'error'" class="mt-6" description="文章加载失败，请稍后重试。">
        <SdButton @click="refresh">重试</SdButton>
      </ErrorState>
      <template v-else>
        <div v-if="rows.length" class="mt-2">
          <PostRow v-for="a in rows" :key="a.articleId" :article="a" />
        </div>
        <EmptyState
          v-else
          class="mt-10"
          title="该标签下暂无公开文章"
          description="换个标签看看，或回到全部文章。"
        >
          <SdButton to="/tags" variant="ghost" class="mt-1">全部标签</SdButton>
        </EmptyState>
        <AppPagination
          class="mt-8"
          :page="page"
          :total="data?.total ?? 0"
          :page-size="pageSize"
          :link-for="(n) => ({ path: `/tag/${slug}`, query: n > 1 ? { page: n } : {} })"
        />
      </template>
    </section>

    <CtaBand />
  </div>
</template>
