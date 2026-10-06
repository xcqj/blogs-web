<script setup lang="ts">
// 文章卡片（design/home.html .card / app.css .acard 基线）：全站列表/搜索/标签/用户页复用。
// 尺寸与状态全部走 token shortcut（sd-card / card-hover / sd-chip / sd-muted），不写魔法值。
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()

// 日期截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异与浏览器 API
const displayDate = computed(() => (props.article.publishedAt || '').slice(0, 10))
</script>

<template>
  <article class="sd-card card-hover flex gap-4 p-4">
    <NuxtLink v-if="article.coverUrl" :to="`/post/${article.articleId}`" class="hidden shrink-0 sm:block">
      <img :src="article.coverUrl" :alt="article.title" class="h-24 w-36 rounded-md object-cover" />
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <NuxtLink
        :to="`/post/${article.articleId}`"
        class="block truncate text-lg font-semibold transition hover:text-primary"
      >
        {{ article.title }}
      </NuxtLink>
      <p class="mt-1 line-clamp-2 text-sm text-muted">
        {{ article.summary }}
      </p>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{{ article.authorName }}</span>
        <span class="sd-dot" />
        <span>{{ displayDate }}</span>
        <span class="sd-dot" />
        <span class="inline-flex items-center gap-1"><span class="i-mdi:eye-outline" aria-hidden="true" />{{ article.viewCount }}</span>
      </div>
    </div>
  </article>
</template>
