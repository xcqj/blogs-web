<script setup lang="ts">
// 首页（design/home.html 定稿版式，桶A）：静态 Hero（左文案 + 右纵深叠层，移动端隐藏）
// + 双栏「最新文章 / 标签侧栏」。数据仍走 §5.1/§7.1/§7.2 三个 SSR useAsyncData，版式与数据解耦。
import type { ArticleSummary, PageResult, TagItem } from '~/types/blog'

const { data: page } = await useAsyncData('home-articles', () =>
  $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', { query: { pageNum: 1, pageSize: 10 } })
)
const { data: featured } = await useAsyncData('home-featured-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/featured'))
const { data: hot } = await useAsyncData('home-hot-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/hot', { query: { limit: 12 } }))

const siteName = useRuntimeConfig().public.siteName
useSeoMeta({
  title: () => `${siteName} · 把技术一层层读到深处`,
  description: '多作者技术博客前台：阅读、搜索与评论。'
})
</script>

<template>
  <div class="space-y-8">
    <!-- Hero -->
    <section class="hero relative overflow-hidden rounded-xl border border-border p-6 md:grid md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-6 md:p-12">
      <div>
        <h1 class="text-display font-extrabold tracking-tight">
          把技术读到<br class="hidden sm:block" />
          <span class="text-primary">深处</span>
        </h1>
        <p class="mt-4 max-w-[46ch] text-muted">
          {{ siteName }} —— 一个多作者技术博客。从源码到系统，一层层往深处读：阅读、搜索与评论。
        </p>
        <a href="#latest" class="btn-primary mt-7">开始阅读 →</a>
      </div>
      <!-- 纵深叠层：< 768 隐藏（性能与首屏，见 design/responsive.html）；three.js 属桶B -->
      <div class="hidden md:block">
        <HeroVisual />
      </div>
    </section>

    <!-- 最新文章 + 侧栏 -->
    <div id="latest" class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section>
        <h2 class="sd-eyebrow mb-4">最新文章</h2>
        <div class="space-y-3.5">
          <ArticleCard v-for="a in page?.rows" :key="a.articleId" :article="a" />
        </div>
        <EmptyState
          v-if="!page?.rows?.length"
          title="还没有文章"
          description="这个列表暂时是空的，去别处看看或稍后再来。"
        >
          <NuxtLink to="/tags" class="btn-ghost mt-1">逛标签</NuxtLink>
        </EmptyState>
        <div v-if="page?.total" class="mt-4 flex items-center justify-between text-sm text-muted">
          <span>共 {{ page.total }} 篇</span>
          <NuxtLink v-if="page.total > 10" to="/page/2" class="transition hover:text-primary">更早文章 →</NuxtLink>
        </div>
      </section>

      <aside class="space-y-4">
        <div class="sd-card p-5">
          <h2 class="sd-eyebrow mb-3">热门标签</h2>
          <div class="flex flex-wrap gap-2">
            <TagChip v-for="t in hot" :key="t.tagId" :slug="t.slug" :name="`${t.name} · ${t.articleCount ?? 0}`" />
            <span v-if="!hot?.length" class="text-xs text-muted">暂无</span>
          </div>
        </div>
        <div class="sd-card p-5">
          <h2 class="sd-eyebrow mb-3">精选标签</h2>
          <div class="flex flex-wrap gap-2">
            <TagChip v-for="t in featured" :key="t.tagId" :slug="t.slug" :name="t.name" />
            <span v-if="!featured?.length" class="text-xs text-muted">暂无</span>
          </div>
        </div>
        <div class="sd-card p-5">
          <h2 class="sd-eyebrow mb-3">关于</h2>
          <p class="text-sm text-muted">{{ siteName }} · 多作者技术博客前台，基于 Nuxt 4 SSR。</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.hero {
  background: var(--hero-bg);
}
</style>
