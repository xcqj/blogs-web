<script setup lang="ts">
import type { ArticleSummary, PageResult } from '~/types/blog'

// /search —— §6 公共搜索。keyword 来自 query，SSR 取数（结果进首屏，利于 SEO/分享）。
const route = useRoute()
const router = useRouter()
const keyword = computed(() => String(route.query.keyword || '').trim())
const input = ref(keyword.value)
watch(keyword, (v) => (input.value = v))

const pageSize = 20
const { data } = await useAsyncData(
  `search-${keyword.value}`,
  () =>
    keyword.value
      ? $fetch<PageResult<ArticleSummary>>('/api/blog/public/search', {
          query: { keyword: keyword.value, pageNum: 1, pageSize }
        })
      : Promise.resolve({ rows: [], total: 0 } as PageResult<ArticleSummary>),
  { watch: [keyword] }
)

function submit() {
  const kw = input.value.trim()
  if (!kw) return
  router.push({ path: '/search', query: { keyword: kw } })
}

useSeoMeta({ title: () => (keyword.value ? `搜索：${keyword.value} · 博客前台` : '搜索') })
</script>

<template>
  <section>
    <form class="mx-auto flex max-w-xl gap-2" @submit.prevent="submit">
      <input
        v-model="input"
        type="search"
        placeholder="搜索文章标题 / 摘要 / 正文…"
        class="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button type="submit" class="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90">搜索</button>
    </form>

    <div class="mt-6">
      <!-- 有关键词才展示结果区 -->
      <template v-if="keyword">
        <p class="mb-3 text-sm text-gray-500">
          “{{ keyword }}” 的搜索结果：共 {{ data?.total ?? 0 }} 篇
        </p>
        <div class="space-y-3">
          <ArticleCard v-for="a in data?.rows" :key="a.articleId" :article="a" />
          <p v-if="!data?.rows?.length" class="py-10 text-center text-sm text-gray-400">没有找到相关文章</p>
        </div>
      </template>
      <p v-else class="py-10 text-center text-sm text-gray-400">输入关键词开始搜索</p>
    </div>
  </section>
</template>
