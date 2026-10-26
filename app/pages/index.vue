<script setup lang="ts">
// 首页（方向 C，按 Stitch「首页1.1」HTML 逐项校准 2026-10-27）：
//   01 hero（12 栏栅格：左 8 栏文案 + 右 4 栏状态卡，上下 40px）
//   02 最新文章（主列 8 栏 + 右栏 4 栏卡片，头条 + 数据行）
//   03 收尾（2px 深线 + 编号）
// 数据走 §5.1/§7.1/§7.2 三个 SSR useAsyncData，零新接口、零类型改动。
import type { ArticleSummary, PageResult, TagItem } from '~/types/blog'

const { data: page, status: pageStatus, refresh: refreshPage } = await useAsyncData('home-articles', () =>
  $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', { query: { pageNum: 1, pageSize: 10 } })
)
const { data: featured } = await useAsyncData('home-featured-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/featured'))
const { data: hot } = await useAsyncData('home-hot-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/hot', { query: { limit: 12 } }))

// 第 1 篇做 LATEST 头条，其余走数据行（后端已按 published_at 倒序）
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
  <div>
    <!-- 01 // MANIFESTO：单栏（用户 2026-10-27 明确不要右侧状态卡）。
         标题 44px 固定 + 末尾靛蓝方块；正文区限 760px，避免 1180 容器下行过长 -->
    <!-- 导航底到「01」的留白：用户 2026-10-26 明确要求压到 24px。
         此处 pt 归零，由 layouts/default 的 py-6 承担，避免两处叠加成 64px。
         （Stitch 原稿是容器 py-16 + hero py-10 = 104px，这是它没执行"减小留白"指令的结果，不采纳。） -->
    <section class="border-b border-border pb-10">
      <div class="max-w-[760px]">
        <p class="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">01 // MANIFESTO</p>
        <h1 class="mb-3 font-serif text-[2rem] font-bold leading-[1.1] tracking-[var(--ls-h1)] md:text-[44px]">
          把技术读到<span class="text-primary-fg">深处</span><span
            class="ml-2 inline-block h-2.5 w-2.5 align-baseline bg-primary"
            aria-hidden="true"
          />
        </h1>
        <!-- 规格是单行 truncate（Stitch 原样）；文案控制在约 30 字，避免被省略号截断 -->
        <p class="mb-5 truncate text-[15px] leading-tight text-muted md:text-[18px]">
          从源码到系统，一层层往深处读：底层架构、内核机制与长期工程实践。
        </p>
        <div class="flex items-center gap-4">
          <SdButton href="#latest" class="px-6">开始阅读 →</SdButton>
          <SdButton to="/tags" variant="secondary" class="px-6">关于本站</SdButton>
        </div>
      </div>
    </section>

    <!-- 02 // 最新文章：主列 8 栏 + 右栏 4 栏（<1024 右栏下移） -->
    <section id="latest" class="grid grid-cols-1 items-start gap-10 pt-12 lg:grid-cols-12 lg:gap-14 lg:pt-16">
      <div class="lg:col-span-8">
        <SectionMark index="02" title="最新文章">
          <template #right>
            <!-- 右侧计数 13px（Stitch body-sm），不是 12px -->
            <span v-if="page?.total" class="font-mono text-[13px] tracking-wide text-dim">
              共 {{ page.total }} 篇 · 更早文章 →
            </span>
          </template>
        </SectionMark>

        <div class="mt-8">
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
            <div v-else key="list">
              <template v-if="lead">
                <FeaturedPost :article="lead" />
                <div class="flex flex-col border-t border-border">
                  <PostRow v-for="a in rest" :key="a.articleId" :article="a" />
                </div>
              </template>
              <EmptyState v-else title="还没有文章" description="这个列表暂时是空的，去别处看看或稍后再来。">
                <SdButton to="/tags" variant="ghost" class="mt-1">逛标签</SdButton>
              </EmptyState>

              <!-- 列表底部（Stitch 实测）：单条主色链接「查看全部 N 篇深度技术文章 →」，
                   不是左右两栏统计——之前做成 justify-between 的统计行，与设计稿结构就不一样 -->
              <div v-if="page?.total" class="pt-10 pb-4">
                <NuxtLink
                  v-if="page.total > 10"
                  to="/page/2"
                  class="inline-flex items-center gap-2 font-mono text-xs font-medium text-primary-fg transition-colors hover:text-text"
                >
                  查看全部 {{ page.total }} 篇深度技术文章 →
                </NuxtLink>
                <p v-else class="font-mono text-xs text-dim">共 {{ page.total }} 篇</p>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 右栏：两张卡（1px 边框 + p-6，Stitch 原样；不加阴影以守 C 版"零阴影"纪律） -->
      <aside class="flex flex-col gap-8 lg:sticky lg:top-24 lg:col-span-4 lg:mt-6 lg:self-start">
        <div v-reveal class="rounded-sm border border-border bg-surface p-6">
          <div class="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span class="font-mono text-[11px] uppercase tracking-[0.1em] text-dim">TAGS // 标签索引</span>
            <NuxtLink to="/tags" class="font-mono text-[11px] text-primary-fg hover:underline">全部 →</NuxtLink>
          </div>

          <div class="mb-4">
            <p class="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-dim">热门</p>
            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-for="t in hot?.slice(0, 8)"
                :key="t.tagId"
                :to="`/tag/${encodeURIComponent(t.slug)}`"
                class="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 py-1 font-mono text-[12px] text-text transition-colors hover:border-border-strong"
              >
                <!-- 长标签名截断：库里存在"全新标签aaaaaaa"这类长名，不截会把两列排布撑乱 -->
                <span class="max-w-[7.5rem] truncate">{{ t.name }}</span>
                <span class="text-dim" aria-hidden="true">·</span>
                <span class="text-primary-fg">{{ t.articleCount ?? 0 }}</span>
              </NuxtLink>
              <span v-if="!hot?.length" class="text-xs text-muted">暂无</span>
            </div>
          </div>

          <div class="my-5 border-b border-border" />

          <div>
            <p class="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-dim">精选</p>
            <!-- 精选用「白底 + 边框」与正文内的灰底标签区分层级（Stitch 口径），
                 不再复用 TagChip，否则右栏里两种标签看不出差别 -->
            <div class="flex flex-wrap gap-1.5">
              <NuxtLink
                v-for="t in featured"
                :key="t.tagId"
                :to="`/tag/${encodeURIComponent(t.slug)}`"
                class="max-w-full truncate rounded-sm border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                {{ t.name }}
              </NuxtLink>
              <span v-if="!featured?.length" class="text-xs text-muted">暂无</span>
            </div>
          </div>
        </div>

        <div v-reveal="90" class="rounded-sm border border-border bg-surface p-6">
          <div class="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span class="font-mono text-[11px] uppercase tracking-[0.1em] text-dim">ABOUT // 关于本站</span>
          </div>
          <p class="mb-3 font-serif text-[18px] font-bold tracking-[var(--ls-title)]">{{ siteName }}</p>
          <p class="text-[13px] leading-[1.7] text-muted">
            一个多作者中文技术博客。从源码到系统，把技术一层层往深处读——阅读、搜索与评论。
          </p>
          <!-- 两行真实信息：不编造"主理编辑 / 更新方式 / EST. 2024"（无字段支撑），
               改用可在库里验证的两项——公开文章总数与内容组织方式 -->
          <div class="mt-4 flex flex-col gap-2 border-t border-border pt-4 font-mono text-[12px] text-muted">
            <div class="flex items-center justify-between">
              <span class="text-dim">公开文章</span>
              <span class="text-text">{{ page?.total ?? 0 }} 篇</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-dim">内容组织</span>
              <span class="text-text">全局标签</span>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <!-- 03 收尾 -->
    <CtaBand index="03" label="CONTRIBUTION" />
  </div>
</template>
