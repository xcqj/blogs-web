<script setup lang="ts">
// /post/{slug} —— 文章详情（design/article.html 版式，桶A 第6点）。契约 §1.4：slug 承载 articleId。
// §5.2 详情 + §10.1 评论列表 SSR；发表评论 §10.2 走 CSR。TOC/上一篇下一篇未做：契约无对应接口且本步未列，需要时先补后端。
import type { ArticleDetail, Comment, PageResult } from '~/types/blog'
import { buildToc } from '~/utils/toc'

const route = useRoute()
const articleId = computed(() => String(route.params.slug || ''))

// SSR 取数必须走 useRequestFetch：全局 $fetch 的内部请求不转发浏览器 Cookie（S14 同款坑），
// 详情代理因此读不到 visitorId/token cookie——表现为刷新页面时阅读量去重永不命中
// （SSR 每次生成新 UUID）、登录用户也不走 userId 去重；SPA 内导航是浏览器直连所以一直正常。
// 其它公共页（列表/搜索/标签/用户页）不依赖 cookie，保持全局 $fetch 不动。
const requestFetch = useRequestFetch()

// 评论区的空态与登录引导互斥：未登录时由 CommentForm 承担「登录后参与讨论」，
// 这里只在已登录（且零评论）时展示「还没有评论」，避免两个空态叠在一起。
const { logged } = useAuth()

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

// 封面去重：未手选封面时保存会自动回填正文首图（plan.md §2.8「自动封面 A 方案」），
// 于是详情页「顶部封面 + 正文首图」会把同一张图显示两次。
// 判据 = 该封面地址是否已作为 <img> 出现在**本篇**正文 HTML 里（纯正则，SSR 安全，不用 DOMParser）；
// 手动选的、正文里没有的封面照常显示。注意与"是不是网络 URL"无关。
const showCover = computed(() => {
  const cover = version.value?.coverUrl
  if (!cover) return false
  const html = version.value?.content || ''
  // URL 里的正则元字符要转义，否则 . ? 等会被当成通配
  const escaped = cover.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return !new RegExp(`<img[^>]+src=["']${escaped}["']`).test(html)
})

// 文章目录（S27）：从正文 HTML 解析 h2/h3 并注入 sec-N 锚点。
// 纯函数、SSR 安全——不能用 DOMParser（服务端没有），也不能等 hydration 后扫 DOM
// （那会让首屏无目录、锚点不存在于 SSR 输出，影响分享与爬虫）。
const toc = computed(() => buildToc(version.value?.content || ''))
const showToc = computed(() => toc.value.items.length >= 2)
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
    <!-- 双栏（lg 起）：正文 700 + 目录 200 整体居中，两侧留白相等。
         用 flex 而非 grid：grid 的 1fr 会让正文在自己的列内居中，整体重心偏左、目录贴右边。
         窄屏不加 flex，正文仍由 mx-auto 居中，与原来的单栏完全一致。 -->
    <div :class="showToc ? 'lg:flex lg:justify-center lg:gap-16' : ''">
    <article class="sd-measure mx-auto lg:mx-0">
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
      <!-- 标题：衬线 + 48px 档（--text-3xl），限 24ch 防超长标题吃满整行 -->
      <h1 class="max-w-[24ch] font-serif text-3xl font-bold leading-[var(--lh-3xl)] tracking-[var(--ls-h1)]">
        {{ version?.title }}
      </h1>

      <!-- meta 条（方向 C）：一行读完「作者 · 日期 · 阅读量」，标签右端；去掉旧版"作者"副行（冗余） -->
      <div class="mt-4 flex flex-wrap items-center gap-3 border-b border-border pb-5">
        <NuxtLink
          :to="`/user/${article.authorId}`"
          class="flex items-center gap-2.5 transition-colors hover:text-primary-fg"
        >
          <AppAvatar :name="article.authorName" size="sm" />
          <span class="text-sm font-medium">{{ article.authorName }}</span>
        </NuxtLink>
        <span class="sd-dot" />
        <span class="text-xs text-muted">{{ displayDate }}</span>
        <span class="sd-dot" />
        <span class="text-xs text-muted">{{ article.viewCount }} 次阅读</span>
        <div v-if="article.tags?.length" class="ml-auto flex flex-wrap gap-2">
          <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
        </div>
      </div>
    </header>

    <!-- 封面：16:9 + 3px 圆角、无边框（C 版不给照片加框），轻微去饱和/深色压暗走 --thumb-filter。
         v-if 用 showCover 而非直接判 coverUrl：自动回填的封面就是正文首图，重复渲染没有意义 -->
    <img
      v-if="showCover"
      :src="version?.coverUrl"
      :alt="version?.title"
      class="mt-6 aspect-[16/9] w-full rounded-md object-cover [filter:var(--thumb-filter)]"
    />

    <!-- 窄屏目录：<lg 折叠在正文前；宽屏由右侧 aside 承担 -->
    <ArticleToc v-if="showToc" :items="toc.items" variant="inline" class="lg:hidden" />

    <!-- 正文：用 buildToc 注入锚点后的 HTML。
         v-html 不能在客户端改 DOM 属性，锚点必须在 SSR 阶段就存在，否则水合会不一致 -->
    <div class="prose mt-8" v-html="toc.html" />

    <!-- 评论区：§10.1 列表 + §10.2 发表（CSR）；标签已在 meta 条出现，不再重复一份 -->
    <section class="mt-10 border-t border-border pt-8">
      <h2 class="mb-4 text-xl font-bold tracking-[var(--ls-title)]">评论 {{ comments?.total ?? 0 }}</h2>
      <CommentList :items="comments?.rows" />
      <!-- 空态只在已登录时出现：未登录时 CommentForm 自己会渲染「登录后参与讨论 + 去登录」，
           两处同时渲染会堆出两个品牌图标、两段文案（2026-10-27 截图实测）。
           窄栏（66ch）空态用 compact 图标：h-24 在窄栏内头重脚轻（清单6） -->
      <EmptyState
        v-if="!comments?.rows?.length && logged"
        icon-class="h-16 w-16"
        title="还没有评论"
        description="成为第一个讨论这篇的人。"
      />
      <CommentForm :article-id="articleId" @posted="refreshComments" />
    </section>
    </article>

    <!-- 宽屏目录：sticky 吸顶（top-24 避开固定顶栏） -->
    <aside v-if="showToc" class="hidden w-[200px] shrink-0 lg:block">
      <div class="sticky top-24">
        <ArticleToc :items="toc.items" />
      </div>
    </aside>
    </div><!-- /双栏 -->

    <!-- 收尾 CTA band：置于 68ch 窄栏之外，全宽呈现（读者→作者转化入口） -->
    <CtaBand class="mt-12" />
  </div>
</template>
