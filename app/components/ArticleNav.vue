<script setup lang="ts">
// 上一篇 / 下一篇（S28）。
// 抽成组件而非内联：详情页模板已经承载了进度条/封面/目录/评论多块，再加四种组合的分支会继续变长。
import type { AdjacentArticle } from '~/types/blog'

const props = defineProps<{
  prev?: AdjacentArticle | null
  next?: AdjacentArticle | null
}>()

const hasAny = computed(() => Boolean(props.prev || props.next))
</script>

<template>
  <!-- 文本性导航：靠分隔线与字重区分层级，不加卡片底、不加圆角背景、不加箭头 -->
  <nav v-if="hasAny" aria-label="相邻文章" class="mt-12 border-t border-border pt-8">
    <div class="grid gap-6 sm:grid-cols-2">
      <NuxtLink
        v-if="prev"
        :to="`/post/${prev.articleId}`"
        class="group block min-w-0"
      >
        <span class="font-mono text-xs uppercase tracking-[0.08em] text-dim">上一篇</span>
        <p class="mt-1.5 truncate font-serif text-[15px] leading-[1.5] text-text transition-colors duration-150 group-hover:text-primary-fg group-hover:underline">
          {{ prev.title }}
        </p>
      </NuxtLink>

      <NuxtLink
        v-if="next"
        :to="`/post/${next.articleId}`"
        class="group block min-w-0 sm:text-right"
      >
        <span class="font-mono text-xs uppercase tracking-[0.08em] text-dim">下一篇</span>
        <p class="mt-1.5 truncate font-serif text-[15px] leading-[1.5] text-text transition-colors duration-150 group-hover:text-primary-fg group-hover:underline">
          {{ next.title }}
        </p>
      </NuxtLink>
    </div>
  </nav>
</template>
