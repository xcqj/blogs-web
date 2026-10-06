<script setup lang="ts">
import type { ArticleSummary, PageResult, TagItem } from '~/types/blog'

// 首页三块公共数据：文章列表(§5.1) + 精选标签(§7.1) + 热门标签(§7.2)，均 SSR 取数
const { data: page } = await useAsyncData('home-articles', () =>
  $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', { query: { pageNum: 1, pageSize: 10 } })
)
const { data: featured } = await useAsyncData('home-featured-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/featured'))
const { data: hot } = await useAsyncData('home-hot-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/hot', { query: { limit: 12 } }))

useSeoMeta({ title: '博客前台 · 首页', description: '多作者技术博客前台首页' })
</script>

<template>
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- 文章列表 -->
    <section class="space-y-3 lg:col-span-2">
      <h1 class="text-xl font-bold">最新文章</h1>
      <ArticleCard v-for="a in page?.rows" :key="a.articleId" :article="a" />
      <p v-if="!page?.rows?.length" class="py-10 text-center text-sm text-gray-400">暂无文章</p>
      <div class="pt-2 text-sm text-gray-400">共 {{ page?.total ?? 0 }} 篇</div>
    </section>

    <!-- 侧栏：精选 / 热门标签 -->
    <aside class="space-y-6">
      <div class="rounded-lg border border-gray-100 bg-white p-4">
        <h2 class="mb-3 text-sm font-semibold text-gray-700">精选标签</h2>
        <div class="flex flex-wrap gap-2">
          <TagChip v-for="t in featured" :key="t.tagId" :slug="t.slug" :name="t.name" />
          <span v-if="!featured?.length" class="text-xs text-gray-400">暂无</span>
        </div>
      </div>
      <div class="rounded-lg border border-gray-100 bg-white p-4">
        <h2 class="mb-3 text-sm font-semibold text-gray-700">热门标签</h2>
        <div class="flex flex-wrap gap-2">
          <TagChip v-for="t in hot" :key="t.tagId" :slug="t.slug" :name="`${t.name} · ${t.articleCount ?? 0}`" />
          <span v-if="!hot?.length" class="text-xs text-gray-400">暂无</span>
        </div>
      </div>
    </aside>
  </div>
</template>
