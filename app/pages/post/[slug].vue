<script setup lang="ts">
import type { ArticleDetail, Comment, PageResult } from '~/types/blog'

// /post/{slug} —— 文章详情。契约 §1.4：slug 为预留字段，MVP 路由承载 articleId。
// §5.2 详情 + §10.1 评论列表，SSR 取数（内容进首屏，利于 SEO）。发表评论属 §10.2（M2）。
const route = useRoute()
const articleId = computed(() => String(route.params.slug || ''))

const { data: article, error } = await useAsyncData(
  `article-${articleId.value}`,
  () => $fetch<ArticleDetail>(`/api/blog/public/articles/${articleId.value}`),
  { watch: [articleId] }
)
const { data: comments } = await useAsyncData(
  `article-comments-${articleId.value}`,
  () => $fetch<PageResult<Comment>>(`/api/blog/public/articles/${articleId.value}/comments`, {
    query: { pageNum: 1, pageSize: 20 }
  }),
  { watch: [articleId] }
)

// 非公共可见 / 不存在：后端业务失败经代理映射为错误，前端统一按 404（不泄露具体状态，契约 §5.2）
if (error.value || !article.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在或未公开', fatal: true })
}

const version = computed(() => article.value!.currentVersion)
const displayDate = computed(() => (article.value?.publishedAt || '').slice(0, 10))

useSeoMeta({
  title: () => (version.value?.title ? `${version.value.title} · 博客前台` : '文章'),
  description: () => version.value?.summary || ''
})
</script>

<template>
  <article v-if="article" class="rounded-lg border border-gray-100 bg-white p-5 sm:p-8">
    <header>
      <h1 class="text-2xl font-bold leading-snug sm:text-3xl">{{ version?.title }}</h1>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <NuxtLink :to="`/user/${article.authorId}`" class="flex items-center gap-1 hover:text-primary">
          <span class="i-mdi:account-outline" />{{ article.authorName }}
        </NuxtLink>
        <span>{{ displayDate }}</span>
        <span class="flex items-center gap-0.5"><span class="i-mdi:eye-outline" />{{ article.viewCount }}</span>
      </div>
      <div v-if="article.tags?.length" class="mt-3 flex flex-wrap gap-2">
        <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
      </div>
    </header>

    <img
      v-if="version?.coverUrl"
      :src="version.coverUrl"
      :alt="version?.title"
      class="mt-5 w-full rounded object-cover"
    />

    <!-- 正文：后端已净化 HTML，前台 v-html 渲染 + prose 排版（不二次清洗、不假设未净化） -->
    <div class="prose prose-neutral mt-6 max-w-none" v-html="version?.content" />

    <!-- 评论区（§10.1 只读；发表 §10.2 见 M2） -->
    <section class="mt-10 border-t border-gray-100 pt-6">
      <h2 class="text-lg font-semibold">评论 {{ comments?.total ?? 0 }}</h2>
      <ul class="mt-4 space-y-4">
        <li v-for="c in comments?.rows" :key="c.commentId" class="flex gap-3">
          <span class="i-mdi:account-circle mt-0.5 text-xl text-gray-300" />
          <div class="min-w-0">
            <div class="text-xs text-gray-400">
              <span class="text-gray-600">{{ c.userName }}</span> · {{ c.createTime }}
            </div>
            <!-- 评论是纯文本字段，按文本渲染（{{ }} 自动转义，不 v-html） -->
            <p class="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">{{ c.content }}</p>
          </div>
        </li>
      </ul>
      <p v-if="!comments?.rows?.length" class="mt-4 text-sm text-gray-400">还没有评论。</p>
      <p class="mt-6 text-xs text-gray-400">评论功能即将开放（登录后可发表，M2）。</p>
    </section>
  </article>
</template>
