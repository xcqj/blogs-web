<script setup lang="ts">
// 精选文章区（首页通栏大卡）：取 §5.1 列表首条做头条呈现（jason.blog featured essay 语义）。
// 契约无「精选文章」接口（§7.1 featured 仅标签），数据由使用方从列表首条派生，零新接口。
// 无文章时整块不渲染（使用方 v-if 控制）。样式全部走 token shortcut，不写魔法值。
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()

// 日期截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异与浏览器 API
const displayDate = computed(() => (props.article.publishedAt || '').slice(0, 10))
</script>

<template>
  <section v-reveal aria-labelledby="featured-title">
    <h2 id="featured-title" class="sd-eyebrow mb-4">精选</h2>
    <SdCard
      padding="lg"
      class="md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] md:items-center md:gap-8"
    >
      <div class="min-w-0">
        <NuxtLink
          :to="`/post/${article.articleId}`"
          class="block text-2xl font-bold tracking-[var(--ls-h2)] transition hover:text-primary md:text-3xl"
        >
          {{ article.title }}
        </NuxtLink>
        <p v-if="article.summary" class="mt-3 line-clamp-2 text-muted">
          {{ article.summary }}
        </p>
        <!-- 元信息行与 ArticleCard 同规格：作者 · 日期 · 阅读量 + 标签右端 -->
        <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{{ article.authorName }}</span>
          <span class="sd-dot" />
          <span>{{ displayDate }}</span>
          <span class="sd-dot" />
          <span class="inline-flex items-center gap-1">
            <span class="i-mdi:eye-outline" aria-hidden="true" />{{ article.viewCount }}
          </span>
          <div v-if="article.tags?.length" class="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
          </div>
        </div>
        <SdButton variant="cta" :to="`/post/${article.articleId}`" class="mt-6">阅读全文 →</SdButton>
      </div>
      <!-- 封面仅在 md+ 显示（移动端让位给标题与摘要）；与标题链接同目标，
           装饰性重复入口故对辅助技术隐藏、不占 Tab 序列 -->
      <NuxtLink
        v-if="article.coverUrl"
        :to="`/post/${article.articleId}`"
        class="hidden overflow-hidden rounded-md md:block"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          :src="article.coverUrl"
          :alt="article.title"
          width="480"
          height="300"
          loading="lazy"
          decoding="async"
          class="sd-thumb aspect-[8/5] w-full object-cover transition-[transform,filter] duration-300 ease-out hover:scale-[1.03]"
        />
      </NuxtLink>
    </SdCard>
  </section>
</template>
