<script setup lang="ts">
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()

// 日期直接截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异与浏览器 API
const displayDate = computed(() => (props.article.publishedAt || '').slice(0, 10))
</script>

<template>
  <article class="card-hover flex gap-4 rounded-lg border border-gray-100 bg-white p-4">
    <NuxtLink
      v-if="article.coverUrl"
      :to="`/post/${article.articleId}`"
      class="hidden shrink-0 sm:block"
    >
      <img :src="article.coverUrl" :alt="article.title" class="h-24 w-36 rounded object-cover" />
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <NuxtLink :to="`/post/${article.articleId}`" class="block truncate text-lg font-semibold text-gray-900 hover:text-primary">
        {{ article.title }}
      </NuxtLink>
      <p class="mt-1 line-clamp-2 text-sm text-gray-500">
        {{ article.summary }}
      </p>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
      </div>
      <div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span class="i-mdi:account-outline" />
        <span>{{ article.authorName }}</span>
        <span>{{ displayDate }}</span>
        <span class="flex items-center gap-0.5"><span class="i-mdi:eye-outline" />{{ article.viewCount }}</span>
      </div>
    </div>
  </article>
</template>
