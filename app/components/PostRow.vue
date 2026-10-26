<script setup lang="ts">
// 数据行（方向 C 冻结规格 §4.1，S23-T15/T18）：文字左三层 + 右图 132×76。
// 取代 ArticleCard 的「左图卡片」形态——左图会让文字起点右移、扫读时左边缘不齐，
// 且缺 meta 行时行内一大片空白（2026-10-26 对照掘金列表定案）。
//
// 结构：标题 18/700 单行截断 → 摘要 14 单行截断 → meta 行（作者 · 日期 · 阅读 · 右端标签）
// 图片：132×76（16:9、3px、垂直居中），<640 隐藏（窄屏再占 96px 图，标题只剩 8 个字）
// 无封面：整块不渲染，文字延伸到最右，不留空白
// 标题**不用衬线**：18px 衬线可读性差，且能减少首屏衬线字体分片命中
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()
const date = computed(() => (props.article.publishedAt || '').slice(0, 10))

// §6 / D36 服务端高亮（S16）：只有搜索结果（ES 命中）带 highlight，列表/详情接口无此字段，
// 因此这里天然退化为纯文本，无需按页面传开关。
// 片段优先级：summary 命中 > content 命中（摘要没中时正文片段更有信息量）> 原摘要。
// v-html 安全依据（契约 §6）：片段内命中词是唯一新增标签 <em>，其余 HTML 已被 ES 的 html
// 编码器转义、后端不再二次加工——可信任直接渲染，不得拼原始正文。
const titleHtml = computed(() => props.article.highlight?.title?.[0] ?? null)
const summaryHtml = computed(
  () => props.article.highlight?.summary?.[0] ?? props.article.highlight?.content?.[0] ?? null
)
</script>

<template>
  <article class="sd-row items-start">
    <div class="min-w-0 flex-1">
      <h3 class="truncate font-sans text-base font-semibold">
        <NuxtLink :to="`/post/${article.articleId}`" class="transition-colors hover:text-primary-fg">
          <span v-if="titleHtml" v-html="titleHtml" />
          <template v-else>{{ article.title }}</template>
        </NuxtLink>
      </h3>
      <p v-if="summaryHtml" class="mt-1.5 truncate text-sm text-muted" v-html="summaryHtml" />
      <p v-else-if="article.summary" class="mt-1.5 truncate text-sm text-muted">
        {{ article.summary }}
      </p>
      <div class="sd-meta mt-2">
        <span>{{ article.authorName }}</span>
        <span class="sd-dot" />
        <span>{{ date }}</span>
        <span class="sd-dot" />
        <span class="inline-flex items-center gap-1">
          <span class="i-mdi:eye-outline" aria-hidden="true" />{{ article.viewCount }}
        </span>
        <span v-if="article.tags?.length" class="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
        </span>
      </div>
    </div>

    <NuxtLink
      v-if="article.coverUrl"
      :to="`/post/${article.articleId}`"
      class="hidden shrink-0 overflow-hidden rounded-md sm:block"
    >
      <img
        :src="article.coverUrl"
        :alt="article.title"
        width="132"
        height="76"
        loading="lazy"
        decoding="async"
        class="aspect-[16/9] object-cover [filter:var(--thumb-filter)]"
      />
    </NuxtLink>
  </article>
</template>

<style scoped>
/* §6 搜索高亮：服务端片段 <em> 走 token（accent-soft 底 + accent-fg 字），深浅自适应。
   :deep 必须——v-html 注入的节点不带 scoped data 属性。
   该色对已过 contrast 门禁（深 6.43:1 / 浅 7.20:1，「chip 文字」场景）。
   不用只换字色的方案：--accent-fg 与正文色深浅都接近，仅字重差别辨识度不足（曾踩）。 */
.sd-row :deep(em) {
  font-style: normal;
  font-weight: 600;
  color: var(--accent-fg);
  background: var(--accent-soft);
  padding: 0 0.15em;
  border-radius: var(--radius-sm);
}
</style>
