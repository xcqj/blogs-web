<script setup lang="ts">
// /search —— §6 公共搜索。keyword 与 page 都走 query，可分享/可前进后退；SSR 出结果首屏。
import type { ArticleSummary, PageResult } from '~/types/blog'

const route = useRoute()
const router = useRouter()

const keyword = computed(() => String(route.query.keyword || '').trim())
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const pageSize = 10
const input = ref(keyword.value)
watch(keyword, (v) => (input.value = v))

const { data, status, refresh } = await useAsyncData(
  `search-${keyword.value}-${page.value}`,
  () =>
    keyword.value
      ? $fetch<PageResult<ArticleSummary>>('/api/blog/public/search', {
          query: { keyword: keyword.value, pageNum: page.value, pageSize }
        })
      : Promise.resolve({ rows: [], total: 0 } as PageResult<ArticleSummary>),
  { watch: [keyword, page] }
)

function submit() {
  const kw = input.value.trim()
  // 空关键词不查后端（后端会返回「搜索关键字不能为空」业务错误）
  router.replace(kw ? { path: '/search', query: { keyword: kw } } : { path: '/search' })
}

// 搜索结果是带 query 的薄页，禁止被索引避免 SEO 稀释；正文本身仍 SSR 输出
useSeoMeta({
  title: () => (keyword.value ? `搜索：${keyword.value}` : '搜索'),
  description: () => (keyword.value ? `关键词「${keyword.value}」的搜索结果。` : '按关键词搜索文章。'),
  robots: 'noindex,follow'
})
</script>

<template>
  <section>
    <!-- 一体化搜索框（sd-search）：与标签页同一控件，不再"框是框、按钮是按钮" -->
    <form class="sd-search mx-auto mt-2 max-w-xl" @submit.prevent="submit">
      <span class="i-mdi:magnify shrink-0 text-dim" aria-hidden="true" />
      <input v-model="input" type="search" placeholder="搜索文章标题 / 摘要 / 正文…" />
      <button type="submit" class="btn-primary btn-sm">搜索</button>
    </form>

    <div class="mt-8">
      <template v-if="keyword">
        <p class="mb-4 text-sm text-muted">“{{ keyword }}” 共 {{ data?.total ?? 0 }} 篇</p>

        <ArticleListSkeleton v-if="status === 'pending'" :count="3" />
        <ErrorState v-else-if="status === 'error'" description="搜索失败，请稍后重试。">
          <button class="btn-primary" @click="refresh">重试</button>
        </ErrorState>
        <template v-else>
          <div class="space-y-3.5">
            <ArticleCard v-for="a in data?.rows" :key="a.articleId" :article="a" />
          </div>
          <EmptyState
            v-if="!data?.rows?.length"
            title="没有找到相关文章"
            description="换个关键词试试，或去标签页逛逛。"
          >
            <NuxtLink to="/tags" class="btn-ghost mt-1">逛标签</NuxtLink>
          </EmptyState>
          <AppPagination
            :page="page"
            :total="data?.total ?? 0"
            :page-size="pageSize"
            :link-for="(n) => ({ path: '/search', query: { keyword, ...(n > 1 ? { page: n } : {}) } })"
          />
        </template>
      </template>
      <p v-else class="py-10 text-center text-sm text-muted">输入关键词开始搜索</p>
    </div>
  </section>
</template>
