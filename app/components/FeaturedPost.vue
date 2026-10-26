<script setup lang="ts">
// LATEST 头条（方向 C 冻结规格 §4.1，S23-T15）：文字左 + 右图 260×146（16:9、3px、垂直居中）。
// 与列表行同构（图恒在右），只放大字号与图 —— 全站只有一种图文关系，不做两套语言。
// 仅第 1 页生效，由页面决定是否渲染。
// 无封面时右侧整块不渲染、文字延伸到全宽（不留白、不出灰块）。
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()
// 日期截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异
const date = computed(() => (props.article.publishedAt || '').slice(0, 10))
</script>

<template>
  <article class="border-b border-border pb-8">
    <div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
      <div class="min-w-0">
        <p class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">LATEST</p>
        <h2 class="mt-3 font-serif text-2xl font-bold leading-[1.15] tracking-[var(--ls-h1)] md:text-3xl">
          <NuxtLink :to="`/post/${article.articleId}`" class="transition-colors hover:text-primary-fg">
            {{ article.title }}
          </NuxtLink>
        </h2>
        <p v-if="article.summary" class="mt-3 line-clamp-2 max-w-[60ch] text-base text-muted">
          {{ article.summary }}
        </p>
        <div class="sd-meta mt-4">
          <span>{{ article.authorName }}</span>
          <span class="sd-dot" />
          <span>{{ date }}</span>
          <span class="sd-dot" />
          <span class="inline-flex items-center gap-1">
            <span class="i-mdi:eye-outline" aria-hidden="true" />{{ article.viewCount }}
          </span>
        </div>
      </div>

      <!-- 显式 width/height 让浏览器在图片下载前算出比例，防 CLS -->
      <NuxtLink
        v-if="article.coverUrl"
        :to="`/post/${article.articleId}`"
        class="hidden overflow-hidden rounded-md md:block"
      >
        <img
          :src="article.coverUrl"
          :alt="article.title"
          width="260"
          height="146"
          loading="lazy"
          decoding="async"
          class="aspect-[16/9] w-full object-cover [filter:var(--thumb-filter)]"
        />
      </NuxtLink>
    </div>
  </article>
</template>
