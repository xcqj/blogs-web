<script setup lang="ts">
// 首页（design/home.html 定稿版式 + 2026-10-13 模块化中改）：静态 Hero（左文案 + 右纵深叠层，移动端隐藏）
// + 双栏「按月归档分组的文章列表 / 标签侧栏」+ 收尾 CTA band。
// 数据仍走 §5.1/§7.1/§7.2 三个 SSR useAsyncData，版式与数据解耦；零新接口。
import type { ArticleSummary, PageResult, TagItem } from '~/types/blog'

const { data: page, status: pageStatus, refresh: refreshPage } = await useAsyncData('home-articles', () =>
  $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', { query: { pageNum: 1, pageSize: 10 } })
)
const { data: featured } = await useAsyncData('home-featured-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/featured'))
const { data: hot } = await useAsyncData('home-hot-tags', () => $fetch<TagItem[]>('/api/blog/public/tags/hot', { query: { limit: 12 } }))

// 按 publishedAt 年月归档分组（jason.blog 归档语义；groupByMonth 保持后端倒序，只对当前页分组）
const archiveGroups = computed(() => groupByMonth(page.value?.rows ?? []))

const siteName = useRuntimeConfig().public.siteName
useSeoMeta({
  title: () => `${siteName} · 把技术一层层读到深处`,
  description: '多作者技术博客前台：阅读、搜索与评论。',
  ogTitle: () => siteName,
  ogDescription: '多作者技术博客前台：阅读、搜索与评论。',
  ogType: 'website'
})
</script>

<template>
  <div class="space-y-8">
    <!-- Hero（打磨轮5 瘦身）：44px 一行标题 + 一句话 + 中号 CTA，叠层图形降为点缀（160px）。
         内容站首屏应让位给文章列表，品牌图形不再占一屏（用户实测反馈）。
         2026-10-16 二轮精修：叠层真正放大（层 140→170px、容器 240→320px）解决「贴纸感」；
         主栈 5 层 zStep 30 读出「一层层」隐喻；保持 items-center——视觉容器比文案块高，
         底基线对齐会在左上撕出空洞，光学中心对齐才是平衡解（实测 87px 空洞后回退） -->
    <section class="surface-hero relative overflow-hidden rounded-xl border border-border p-6 md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-8 md:p-8">
      <div>
        <h1>
          把技术读到<span class="text-primary">深处</span>
        </h1>
        <p class="mt-2.5 max-w-[52ch] text-muted">
          {{ siteName }} —— 一个多作者技术博客。从源码到系统，一层层往深处读：阅读、搜索与评论。
        </p>
        <SdButton href="#latest" variant="cta" class="mt-5">开始阅读 →</SdButton>
      </div>
      <!-- 品牌母题点缀：< md 隐藏；three.js 属桶B，只走 ClientOnly 槽位。
           容器 320×192，叠层 union 约 255×230，对称溢出进 34px 面板内边距，不裁切 -->
      <div class="hidden w-80 md:block md:h-48 lg:h-52">
        <HeroVisual />
      </div>
    </section>

    <!-- 最新文章 + 侧栏 -->
    <div id="latest" class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section>
        <h2 class="sd-eyebrow mb-4">最新文章</h2>
        <!-- 骨架 / 错误 / 列表三态交叉淡入（M8）：直接替换会“硬跳”，Transition 需单一子节点，
             故末尾统一包一层 div 并用 key 区分状态 -->
        <Transition name="sd-fade" mode="out-in">
          <ArticleListSkeleton v-if="pageStatus === 'pending'" key="skeleton" :count="3" />
          <ErrorState
            v-else-if="pageStatus === 'error'"
            key="error"
            title="文章加载失败"
            description="网络异常或服务暂不可用，请稍后重试。"
          >
            <SdButton @click="refreshPage">重试</SdButton>
          </ErrorState>
          <div v-else key="list">
            <!-- 归档分组：按年月分组（jason.blog 归档语义）；无文章时走空状态 -->
            <div v-if="archiveGroups.length" class="space-y-6">
              <ArchiveGroup v-for="g in archiveGroups" :key="g.key" :label="g.label" :count="g.items.length">
                <ArticleCard v-for="a in g.items" :key="a.articleId" :article="a" />
              </ArchiveGroup>
            </div>
            <EmptyState
              v-else
              title="还没有文章"
              description="这个列表暂时是空的，去别处看看或稍后再来。"
            >
              <SdButton to="/tags" variant="ghost" class="mt-1">逛标签</SdButton>
            </EmptyState>
          </div>
        </Transition>
        <div v-if="page?.total" class="mt-4 flex items-center justify-between text-sm text-muted">
          <span>共 {{ page.total }} 篇</span>
          <NuxtLink v-if="page.total > 10" to="/page/2" class="transition hover:text-primary">更早文章 →</NuxtLink>
        </div>
      </section>

      <!-- 侧栏标题与左列「最新文章」同规格并提到面板外：
           两列顶部结构一致，标题对标题、卡片对第一张卡片自然对齐（不靠魔法值 margin） -->
      <aside class="space-y-4 self-start lg:sticky lg:top-20">
        <!-- v-reveal：侧栏面板错峰进场（M4）。隐藏态由 JS 在 mounted 加 class，
             禁用 JS 或脚本加载失败时内容照常可见，不会白屏 -->
        <div v-reveal>
          <h2 class="sd-eyebrow mb-4">标签</h2>
          <SdCard padding="md">
            <p class="mb-2.5 text-xs font-semibold text-dim">热门</p>
            <div class="flex flex-wrap gap-2">
              <TagChip v-for="t in hot" :key="t.tagId" :slug="t.slug" :name="`${t.name} · ${t.articleCount ?? 0}`" />
              <span v-if="!hot?.length" class="text-xs text-muted">暂无</span>
            </div>
            <div class="my-4 border-t border-border" />
            <p class="mb-2.5 text-xs font-semibold text-dim">精选</p>
            <div class="flex flex-wrap gap-2">
              <TagChip v-for="t in featured" :key="t.tagId" :slug="t.slug" :name="t.name" />
              <span v-if="!featured?.length" class="text-xs text-muted">暂无</span>
            </div>
          </SdCard>
        </div>
        <div v-reveal="90">
          <h2 class="sd-eyebrow mb-4">关于</h2>
          <SdCard padding="md">
            <p class="text-sm text-muted">{{ siteName }} · 多作者技术博客前台，基于 Nuxt 4 SSR。</p>
          </SdCard>
        </div>
      </aside>
    </div>

    <!-- 收尾 CTA 色块（yuanpu 结构特征） -->
    <CtaBand />
  </div>
</template>
