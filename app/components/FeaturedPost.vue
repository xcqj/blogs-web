<script setup lang="ts">
// LATEST 头条（方向 C，S23；按 Stitch 首页 HTML 校准 2026-10-27）。
// 结构：2px 深色顶线 + 顶部行（LATEST 徽标 / 标签 / 日期）→ 主体（文字左 + 右图 260×146）。
// 标题 48px 衬线、最多两行；摘要 15px 两行；meta 等宽 13px。仅第 1 页生效。
// 无封面时右侧整块不渲染、文字延伸到全宽（不留白、不出灰块）。
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()
// 日期截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异
const date = computed(() => (props.article.publishedAt || '').slice(0, 10))

// 整块可点（与 PostRow 同口径）：标题与封面仍是真链接，这里只补鼠标热区
const router = useRouter()
function openArticle(e: MouseEvent) {
  if ((e.target as HTMLElement | null)?.closest('a')) return
  router.push(`/post/${props.article.articleId}`)
}
</script>

<template>
  <article class="mb-8 cursor-pointer border-b border-border pb-8" @click="openArticle">
    <!-- 顶部行：2px 深色顶线是头条的"起版"信号，与全站 1px 细线形成层级差 -->
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3 border-t-2 border-text pt-3">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-sm border border-border bg-overlay px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-fg"
        >
          LATEST
        </span>
        <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
      </div>
      <span class="font-mono text-[11px] tracking-wider text-dim">{{ date }}</span>
    </div>

    <!-- 栅格：≥768 文字左/图右；<768 纵向且**图在上**（flex-col-reverse 让 DOM 顺序保持
         「文字→图」，窄屏反转成「图→文字」，md 回到 row 时又恢复文字左）——台账 §4.2 -->
    <div class="flex flex-col-reverse gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
      <div class="flex min-h-[190px] min-w-0 flex-1 flex-col justify-center">
        <h2 class="mb-3 line-clamp-2 font-serif text-2xl font-bold leading-[1.15] tracking-[var(--ls-h1)] md:text-[3rem]">
          <NuxtLink :to="`/post/${article.articleId}`" class="transition-colors hover:text-primary-fg">
            {{ article.title }}
          </NuxtLink>
        </h2>
        <p v-if="article.summary" class="mb-4 line-clamp-2 max-w-[60ch] text-[15px] leading-[1.6] text-muted">
          {{ article.summary }}
        </p>
        <div class="flex flex-wrap items-center gap-3 font-mono text-[13px] text-dim">
          <span class="font-medium text-text">{{ article.authorName }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ date }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ article.viewCount }} 次阅读</span>
        </div>
      </div>

      <!-- 显式 width/height 让浏览器在图片下载前算出比例，防 CLS -->
      <NuxtLink
        v-if="article.coverUrl"
        :to="`/post/${article.articleId}`"
        class="block w-full shrink-0 overflow-hidden rounded-sm border border-border aspect-video md:aspect-auto md:h-[146px] md:w-[260px]"
      >
        <img
          :src="article.coverUrl"
          :alt="article.title"
          width="260"
          height="146"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover [filter:var(--thumb-filter)]"
        />
      </NuxtLink>
    </div>
  </article>
</template>
