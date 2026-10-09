<script setup lang="ts">
// /post/{slug} —— 文章详情（design/article.html 版式，桶A 第6点）。契约 §1.4：slug 承载 articleId。
// §5.2 详情 + §10.1 评论列表 SSR；发表评论 §10.2 走 CSR。TOC/上一篇下一篇未做：契约无对应接口且本步未列，需要时先补后端。
import type { ArticleDetail, Comment, PageResult } from '~/types/blog'

const route = useRoute()
const articleId = computed(() => String(route.params.slug || ''))

const { data: article, error } = await useAsyncData(
  `article-${articleId.value}`,
  () => $fetch<ArticleDetail>(`/api/blog/public/articles/${articleId.value}`),
  { watch: [articleId] }
)
const { data: comments, refresh: refreshComments } = await useAsyncData(
  `article-comments-${articleId.value}`,
  () => $fetch<PageResult<Comment>>(`/api/blog/public/articles/${articleId.value}/comments`, {
    query: { pageNum: 1, pageSize: 20 }
  }),
  { watch: [articleId] }
)

// 非公共可见 / 不存在：统一 404，不泄露具体状态（契约 §5.2）
if (error.value || !article.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在或未公开', fatal: true })
}

const version = computed(() => article.value!.currentVersion)
const displayDate = computed(() => (article.value?.publishedAt || '').slice(0, 10))
// 阅读进度条（M10）：长文刚需，给读者“还剩多少”的位置感
const { progress } = useReadingProgress()

// head getter 在 setup 上下文之外执行，composable 必须先在 setup 顶层取好再引用
const siteName = useRuntimeConfig().public.siteName

useSeoMeta({
  title: () => (version.value?.title ? `${version.value.title} · ${siteName}` : '文章'),
  description: () => version.value?.summary || '',
  ogTitle: () => version.value?.title || '文章',
  ogDescription: () => version.value?.summary || '',
  ogType: 'article'
})
</script>

<template>
  <article v-if="article" class="sd-measure mx-auto">
    <!-- 阅读进度：固定在顶栏下沿，用 scaleX 不动 width，避免每帧重排 -->
    <div
      class="read-progress fixed top-16 left-0 z-40 h-0.5 w-full bg-primary"
      :style="{ transform: `scaleX(${progress})` }"
      aria-hidden="true"
    />
    <NuxtLink to="/" class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary">
      <span class="i-mdi:arrow-left" aria-hidden="true" />返回文章列表
    </NuxtLink>
    <header>
      <h1 class="max-w-[24ch] text-3xl font-extrabold leading-[var(--lh-3xl)] tracking-[var(--ls-h1)]">{{ version?.title }}</h1>

      <!-- meta 条：头像 + 作者 + 日期 + 阅读量 + 标签 -->
      <div class="mt-4 flex flex-wrap items-center gap-3 border-b border-border pb-5">
        <NuxtLink :to="`/user/${article.authorId}`" class="flex items-center gap-3 transition hover:text-primary">
          <AppAvatar :name="article.authorName" size="md" />
          <span class="leading-tight">
            <b class="block text-sm font-semibold">{{ article.authorName }}</b>
            <span class="block text-xs text-muted">作者</span>
          </span>
        </NuxtLink>
        <span class="sd-dot" />
        <span class="text-xs text-muted">{{ displayDate }}</span>
        <span class="sd-dot" />
        <span class="text-xs text-muted">{{ article.viewCount }} 次阅读</span>
        <div v-if="article.tags?.length" class="flex flex-wrap gap-2">
          <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
        </div>
      </div>
    </header>

    <img
      v-if="version?.coverUrl"
      :src="version.coverUrl"
      :alt="version?.title"
      class="mt-6 aspect-[16/8] w-full rounded-lg border border-border object-cover [filter:var(--thumb-filter)]"
    />

    <!-- 正文：后端已净化 HTML → v-html + prose（prose.css 走 token 定稿，限宽 68ch） -->
    <div class="prose mt-8" v-html="version?.content" />

    <!-- 评论区：§10.1 列表 + §10.2 发表（CSR）；标签已在 meta 条出现，不再重复一份 -->
    <section class="mt-10 border-t border-border pt-8">
      <h2 class="mb-4 text-xl font-bold tracking-[var(--ls-title)]">评论 {{ comments?.total ?? 0 }}</h2>
      <CommentList :items="comments?.rows" />
      <EmptyState v-if="!comments?.rows?.length" title="还没有评论" description="成为第一个讨论这篇的人。" />
      <CommentForm :article-id="articleId" @posted="refreshComments" />
    </section>
  </article>
</template>
