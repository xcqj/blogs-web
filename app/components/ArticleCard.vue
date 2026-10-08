<script setup lang="ts">
// 文章行式卡片（design/home.html .card 基线）：全站列表/搜索/标签/用户页复用。
// 布局规则（2026-10-08 对照掘金列表微调）：保留卡片边框/圆角/hover，但
// ① 缩略图在左侧并放大到 10:7；② 摘要只截 1 行；③ 标签并入元信息行右端，不再单独占行。
// 尺寸与状态全部走 token shortcut（sd-card / card-hover / sd-chip / sd-muted），不写魔法值。
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()

// 日期截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异与浏览器 API
const displayDate = computed(() => (props.article.publishedAt || '').slice(0, 10))
</script>

<template>
  <article class="sd-card card-hover flex gap-4 p-4">
    <!-- 缩略图固定不拉伸：w-40 h-28 = 160×112（10:7，对齐掘金）；窄屏隐藏，无图不预留空位 -->
    <NuxtLink v-if="article.coverUrl" :to="`/post/${article.articleId}`" class="hidden shrink-0 sm:block">
      <img :src="article.coverUrl" :alt="article.title" class="h-28 w-40 rounded-md object-cover" />
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <NuxtLink
        :to="`/post/${article.articleId}`"
        class="block truncate text-lg font-semibold transition hover:text-primary"
      >
        {{ article.title }}
      </NuxtLink>
      <!-- 摘要截 1 行：列表行高保持统一，不靠多行摘要拉高 -->
      <p class="mt-1 line-clamp-1 text-sm text-muted">
        {{ article.summary }}
      </p>
      <!-- 标签与元信息同行（右端），不再单独占一行 -->
      <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{{ article.authorName }}</span>
        <span class="sd-dot" />
        <span>{{ displayDate }}</span>
        <span class="sd-dot" />
        <span class="inline-flex items-center gap-1"><span class="i-mdi:eye-outline" aria-hidden="true" />{{ article.viewCount }}</span>
        <div v-if="article.tags?.length" class="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
        </div>
      </div>
    </div>
  </article>
</template>
