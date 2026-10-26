<script setup lang="ts">
// 首页（方向 C，ROADMAP S23 / P4-T15；规格见 design/stitch/README.md §4.1）：
//   01 hero（薄，≤240px：编号 + 衬线大标题 + 单行副文 + 按钮，右侧系统状态卡）
//   02 最新文章（LATEST 头条 + 数据行列表，右栏标签/关于）
//   03 收尾（CtaBand：2px 主色线起头，左对齐）
// 数据仍走 §5.1/§7.1/§7.2 三个 SSR useAsyncData，版式与数据解耦；零新接口、零类型改动。
// 旧版「大 hero + 按月归档分组 + 卡片列表」已废：归档分组随 C 版取消，改由数据行的日期列承担时间信息。
import type { ArticleSummary, PageResult, TagItem } from '~/types/blog'

const { data: page, status: pageStatus, refresh: refreshPage } = await useAsyncData('home-articles', () =>
  $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', { query: { pageNum: 1, pageSize: 10 } })
)
const { data: featured } = await useAsyncData('home-featured-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/featured'))
const { data: hot } = await useAsyncData('home-hot-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/hot', { query: { limit: 12 } }))

// 第 1 篇做 LATEST 头条，其余走数据行（后端已按 published_at 倒序，第 1 篇即最新）
const rows = computed(() => page.value?.rows ?? [])
const lead = computed(() => rows.value[0] ?? null)
const rest = computed(() => rows.value.slice(1))

const siteName = useRuntimeConfig().public.siteName
useSeoMeta({
  title: () => `${siteName} · 把技术一层层读到深处`,
  description: '多作者技术博客前台：阅读、搜索与评论。',
  ogTitle: () => siteName,
  ogDescription: () => '多作者技术博客前台：阅读、搜索与评论。',
  ogType: 'website'
})
</script>

<template>
  <div class="space-y-12">
    <!-- 01 hero：上下 40px、总高 ≤240px；标题字号 40/48 两档（不用 display 档，否则超规格） -->
    <section class="border-b border-border pb-10">
      <div class="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">01 // MANIFESTO</p>
          <h1 class="mt-3 font-serif text-2xl font-bold leading-[1.1] tracking-[var(--ls-h1)] md:text-3xl">
            把技术读到<span class="text-primary-fg">深处</span>。
          </h1>
          <p class="mt-3 max-w-[60ch] text-sm text-muted md:text-base">
            {{ siteName }} —— 一个多作者技术博客。从源码到系统，一层层往深处读：阅读、搜索与评论。
          </p>
          <div class="mt-5 flex flex-wrap gap-3">
            <SdButton href="#latest">开始阅读 →</SdButton>
            <SdButton to="/tags" variant="ghost">逛标签</SdButton>
          </div>
        </div>
        <!-- 状态卡：窄屏与平板隐藏（<1024 版面放不下，且它不是内容） -->
        <div class="hidden lg:block">
          <SystemStatus />
        </div>
      </div>
    </section>

    <!-- 02 最新文章：主列 + 右栏（<1024 右栏下移） -->
    <div id="latest" class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section class="min-w-0">
        <SectionMark index="02" title="最新文章">
          <template #right>
            <span v-if="page?.total" class="ml-auto font-mono text-xs text-dim">共 {{ page.total }} 篇</span>
          </template>
        </SectionMark>

        <!-- 骨架 / 错误 / 列表三态交叉淡入（M8）：Transition 需单一子节点 -->
        <Transition name="sd-fade" mode="out-in">
          <ArticleListSkeleton v-if="pageStatus === 'pending'" key="skeleton" :count="4" />
          <ErrorState
            v-else-if="pageStatus === 'error'"
            key="error"
            title="文章加载失败"
            description="网络异常或服务暂不可用，请稍后重试。"
          >
            <SdButton class="mt-4" @click="refreshPage">重试</SdButton>
          </ErrorState>
          <div v-else key="list" class="mt-6">
            <template v-if="lead">
              <FeaturedPost :article="lead" />
              <PostRow v-for="a in rest" :key="a.articleId" :article="a" />
            </template>
            <EmptyState v-else title="还没有文章" description="这个列表暂时是空的，去别处看看或稍后再来。">
              <SdButton to="/tags" variant="ghost" class="mt-1">逛标签</SdButton>
            </EmptyState>

            <div
              v-if="page?.total"
              class="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-[0.08em] text-muted"
            >
              <span>共 {{ page.total }} 篇</span>
              <NuxtLink v-if="page.total > 10" to="/page/2" class="transition-colors hover:text-primary-fg">
                更早文章 →
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </section>

      <!-- 右栏：不用卡片（C 版靠 1px 线与小节标题分层），桌面吸顶跟随 -->
      <aside class="space-y-8 lg:sticky lg:top-[88px] lg:self-start">
        <div v-reveal>
          <h2 class="font-serif text-lg font-bold tracking-[var(--ls-title)]">标签</h2>
          <div class="mt-3.5">
            <p class="font-mono text-xs uppercase tracking-[0.08em] text-dim">热门</p>
            <div class="mt-2.5 flex flex-wrap gap-2">
              <TagChip v-for="t in hot" :key="t.tagId" :slug="t.slug" :name="`${t.name} ${t.articleCount ?? 0}`" />
              <span v-if="!hot?.length" class="text-xs text-muted">暂无</span>
            </div>
          </div>
          <div class="mt-4 border-t border-border pt-4">
            <p class="font-mono text-xs uppercase tracking-[0.08em] text-dim">精选</p>
            <div class="mt-2.5 flex flex-wrap gap-2">
              <TagChip v-for="t in featured" :key="t.tagId" :slug="t.slug" :name="t.name" />
              <span v-if="!featured?.length" class="text-xs text-muted">暂无</span>
            </div>
          </div>
        </div>

        <div v-reveal="90" class="border-t border-border pt-6">
          <h2 class="font-serif text-lg font-bold tracking-[var(--ls-title)]">关于</h2>
          <p class="mt-3 text-sm text-muted">{{ siteName }} · 多作者技术博客前台，基于 Nuxt 4 SSR。</p>
        </div>
      </aside>
    </div>

    <!-- 03 收尾 -->
    <CtaBand />
  </div>
</template>
