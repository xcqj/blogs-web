<script setup lang="ts">
// 文章行式卡片（design/home.html .card 基线）：全站列表/搜索/标签/用户页复用。
// 布局规则（2026-10-08 对照掘金列表微调）：保留卡片边框/圆角/hover，但
// ① 缩略图在左侧并放大到 10:7；② 摘要只截 1 行（truncate + 预留行高）；③ 标签并入元信息行右端。
// 尺寸与状态全部走 token shortcut（sd-card / card-hover / sd-chip / sd-muted），不写魔法值。
import type { ArticleSummary } from '~/types/blog'

const props = defineProps<{ article: ArticleSummary }>()

// 日期截断后端 "yyyy-MM-dd HH:mm:ss" 前 10 位，避免 SSR 端 Date/locale 差异与浏览器 API
const displayDate = computed(() => (props.article.publishedAt || '').slice(0, 10))

// §6 / D36 服务端高亮（S16）：只有搜索结果（ES 命中）才带 highlight，列表/详情缺失。
// 摘要位片段优先级：summary 命中 > content 命中（摘要没中时正文片段更有信息量）> 原摘要。
// v-html 安全依据（契约 §6）：片段内命中词为唯一新增标签 <em>，其余 HTML 已被 ES 默认
// 编码器转义（encoder=html），后端不再二次加工——可信任直接渲染，不得拼原始正文。
const titleHtml = computed(() => props.article.highlight?.title?.[0] ?? null)
const summaryHtml = computed(
  () => props.article.highlight?.summary?.[0] ?? props.article.highlight?.content?.[0] ?? null
)
</script>

<template>
  <article class="sd-card card-hover group flex gap-4 p-4">
    <!-- 缩略图固定不拉伸：w-40 h-28 = 160×112（10:7，对齐掘金）；窄屏隐藏，无图不预留空位 -->
    <NuxtLink v-if="article.coverUrl" :to="`/post/${article.articleId}`" class="hidden shrink-0 overflow-hidden rounded-md sm:block">
      <!-- 显式 width/height 让浏览器在图片下载前就算出比例，防 CLS（加载完布局跳动）；
           列表图在首屏之下，用 lazy + async 解码 -->
      <img
        :src="article.coverUrl"
        :alt="article.title"
        width="160"
        height="112"
        loading="lazy"
        decoding="async"
        class="sd-thumb h-28 w-40 transition-[transform,filter] duration-300 ease-out group-hover:scale-[1.04] group-hover:[filter:none]"
      />
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <!-- 标题：<sm 两行截断（390px 下 24px 单行仅约 12 字，两行给足语义；sm+ 保持 truncate 单行）。
           实现要点：line-clamp-2 自带 display:-webkit-box，不能被 block 工具类覆盖（会静默失效），
           故 sm+ 用 sm:block 复位；Chromium 新版对 -webkit-line-clamp 可能不出省略号——
           上线前须 390px 实测，不达标则补标准 line-clamp 属性。balance 与两行截断组合生效 -->
      <NuxtLink
        :to="`/post/${article.articleId}`"
        class="relative line-clamp-2 text-xl font-bold tracking-[var(--ls-title)] [text-wrap:balance] transition hover:text-primary sm:block sm:truncate after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-[width] after:duration-200 group-hover:after:w-full"
      >
        <!-- 搜索命中时渲染服务端高亮片段（含 <em>），否则纯文本标题 -->
        <span v-if="titleHtml" v-html="titleHtml" />
        <template v-else>{{ article.title }}</template>
      </NuxtLink>
      <!-- 摘要截 1 行：用 truncate（nowrap+ellipsis）而非 line-clamp-1——后者依赖 -webkit-box，
           新版 Chromium 已改由标准 line-clamp 接管并可能不出省略号。
           无摘要时整行不渲染（上版用 min-h-7 预留行高，实测在无摘要条目里造成一大块死白）。
           搜索命中且摘要未中时降级渲染正文片段（summaryHtml 已含降级链），否则原摘要 -->
      <p v-if="summaryHtml" class="mt-1 truncate text-sm text-muted" v-html="summaryHtml" />
      <p v-else-if="article.summary" class="mt-1 truncate text-sm text-muted">
        {{ article.summary }}
      </p>
      <!-- 标签与元信息同行（右端），不再单独占一行 -->
      <div class="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted">
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

<style scoped>
/* §6 / D36 搜索高亮：服务端片段 <em> 包裹命中词，样式走 token（accent-fg 前景强调，
   深浅色自适应）；not-italic 消 UA 默认斜体，字重微调让命中词"跳"但不刺眼。
   :deep 必须——v-html 注入的节点不带 scoped data 属性。
   三轮精修（用户截图反馈「关键词显示的不太明显」）：仅换字色不可辨——深浅主题下
   --accent-fg（#e4dbc9/#2f2c25）与正文色（#f4f1ea/#211e1d）几乎同色，只剩字重差别。
   改 chip 式：accent-soft 底 + accent-fg 字 + 微 padding/圆角（标准搜索高亮观感）。
   该色对已过 contrast.mjs「chip 文字」门禁：深 8.98:1 / 浅 10.80:1。 */
.sd-card :deep(em) {
  font-style: normal;
  font-weight: 600;
  color: var(--accent-fg);
  background: var(--accent-soft);
  padding: 0 0.15em;
  border-radius: var(--radius-sm);
}
</style>
