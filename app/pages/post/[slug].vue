<script setup lang="ts">
// /post/{slug} —— 文章详情（design/article.html 版式，桶A 第6点）。契约 §1.4：slug 承载 articleId。
// §5.2 详情 + §10.1 评论列表 SSR；发表评论 §10.2 走 CSR。TOC/上一篇下一篇未做：契约无对应接口且本步未列，需要时先补后端。
import type { ArticleDetail, Comment, PageResult } from '~/types/blog'

const route = useRoute()
const articleId = computed(() => String(route.params.slug || ''))

// SSR 取数必须走 useRequestFetch：全局 $fetch 的内部请求不转发浏览器 Cookie（S14 同款坑），
// 详情代理因此读不到 visitorId/token cookie——表现为刷新页面时阅读量去重永不命中
// （SSR 每次生成新 UUID）、登录用户也不走 userId 去重；SPA 内导航是浏览器直连所以一直正常。
// 其它公共页（列表/搜索/标签/用户页）不依赖 cookie，保持全局 $fetch 不动。
const requestFetch = useRequestFetch()

const { data: article, error } = await useAsyncData(
  `article-${articleId.value}`,
  () => requestFetch<ArticleDetail>(`/api/blog/public/articles/${articleId.value}`),
  { watch: [articleId] }
)
const { data: comments, refresh: refreshComments } = await useAsyncData(
  `article-comments-${articleId.value}`,
  () => $fetch<PageResult<Comment>>(`/api/blog/public/articles/${articleId.value}/comments`, {
    query: { pageNum: 1, pageSize: 20 }
  }),
  { watch: [articleId] }
)

// 非公共可见 / 不存在：统一 404，不泄露具体状态（契约 §5.2）
if (error.value || !article.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在或未公开', fatal: true })
}

const version = computed(() => article.value!.currentVersion)
const displayDate = computed(() => (article.value?.publishedAt || '').slice(0, 10))
// 阅读进度条（M10）：长文刚需，给读者“还剩多少”的位置感。
// 与顶栏联动（M11 修复）：窄屏顶栏下滑隐藏时进度条随之一并收起，不孤悬在 top-16
// （桌面不受影响：CSS 媒体查询限制，同 .site-header 口径）。
const { progress } = useReadingProgress()
const { hideHeader } = useScrollDirection()

// head getter 在 setup 上下文之外执行，composable 必须先在 setup 顶层取好再引用
const siteName = useRuntimeConfig().public.siteName
const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: () => (version.value?.title ? `${version.value.title} · ${siteName}` : '文章'),
  description: () => version.value?.summary || '',
  ogTitle: () => version.value?.title || '文章',
  ogDescription: () => version.value?.summary || '',
  ogType: 'article',
  // S17 SEO 扩展（D30 不引 @nuxtjs/seo，unhead 原生承载）：规范 URL + 封面图（无封面则省略）
  ogUrl: () => `${siteUrl}/post/${articleId.value}`,
  ogImage: () => version.value?.coverUrl || undefined
})

// S17 JSON-LD Article 结构化数据（view-source 可抽验）：在 useSeoMeta 基线之外用 useHead 注入 ld+json
const canonicalUrl = computed(() => `${siteUrl}/post/${articleId.value}`)
// 后端时间 "yyyy-MM-dd HH:mm:ss" → ISO 8601 本地时间（schema.org datePublished/dateModified 接受）
const isoLocal = (t?: string) => (t ? t.replace(' ', 'T') : undefined)

const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: version.value?.title || '文章',
  description: version.value?.summary || undefined,
  image: version.value?.coverUrl || undefined,
  datePublished: isoLocal(article.value?.publishedAt),
  dateModified: isoLocal(version.value?.createTime),
  author: { '@type': 'Person', name: article.value?.authorName || '佚名' },
  publisher: { '@type': 'Organization', name: siteName },
  mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl.value }
}))

useHead({
  link: computed(() => [{ rel: 'canonical', href: canonicalUrl.value }]),
  script: computed(() => [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }])
})
</script>

<template>
  <div v-if="article">
    <article class="sd-measure mx-auto">
    <!-- 阅读进度：包裹层负责随顶栏隐藏一起收起（is-hidden 由 hideHeader 驱动，
         内层 read-progress 专职 scaleX，两者 transform 不冲突） -->
    <div class="read-progress-wrap fixed left-0 top-16 z-40 w-full" :class="{ 'is-hidden': hideHeader }">
      <div
        class="read-progress h-0.5 w-full bg-primary"
        :style="{ transform: `scaleX(${progress})` }"
        aria-hidden="true"
      />
    </div>
    <NuxtLink to="/" class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-primary">
      <span class="i-mdi:arrow-left" aria-hidden="true" />返回文章列表
    </NuxtLink>
    <header>
      <h1 class="max-w-[24ch] text-3xl font-bold leading-[var(--lh-3xl)] tracking-[var(--ls-h1)]">{{ version?.title }}</h1>

      <!-- meta 条：头像 + 作者 + 日期 + 阅读量 + 标签 -->
      <div class="mt-4 flex flex-wrap items-center gap-3 border-b border-border pb-5">
        <NuxtLink :to="`/user/${article.authorId}`" class="flex items-center gap-3 transition hover:text-primary">
          <AppAvatar :name="article.authorName" size="md" />
          <span class="leading-tight">
            <b class="block text-sm font-semibold">{{ article.authorName }}</b>
            <span class="block text-xs text-muted">作者</span>
          </span>
        </NuxtLink>
        <span class="sd-dot" />
        <span class="text-xs text-muted">{{ displayDate }}</span>
        <span class="sd-dot" />
        <span class="text-xs text-muted">{{ article.viewCount }} 次阅读</span>
        <div v-if="article.tags?.length" class="flex flex-wrap gap-2">
          <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
        </div>
      </div>
    </header>

    <img
      v-if="version?.coverUrl"
      :src="version.coverUrl"
      :alt="version?.title"
      class="mt-6 aspect-[16/8] w-full rounded-lg border border-border object-cover [filter:var(--thumb-filter)]"
    />

    <!-- 正文：后端已净化 HTML → v-html + prose（prose.css 走 token 定稿，限宽 68ch） -->
    <div class="prose mt-8" v-html="version?.content" />

    <!-- 评论区：§10.1 列表 + §10.2 发表（CSR）；标签已在 meta 条出现，不再重复一份 -->
    <section class="mt-10 border-t border-border pt-8">
      <h2 class="mb-4 text-xl font-bold tracking-[var(--ls-title)]">评论 {{ comments?.total ?? 0 }}</h2>
      <CommentList :items="comments?.rows" />
      <!-- 窄栏（68ch）空态用 compact 图标：h-24 在窄栏内头重脚轻（清单6） -->
      <EmptyState v-if="!comments?.rows?.length" icon-class="h-16 w-16" title="还没有评论" description="成为第一个讨论这篇的人。" />
      <CommentForm :article-id="articleId" @posted="refreshComments" />
    </section>
    </article>
    <!-- 收尾 CTA band：置于 68ch 窄栏之外，全宽呈现（读者→作者转化入口） -->
    <CtaBand class="mt-12" />
  </div>
</template>
