<script setup lang="ts">
// /tags —— 全站标签索引（导航「标签」落点，§7.5 公共标签列表）。SSR 取数，chip 云 + 关键词过滤。
// 方向 C（S23-T17）：编号小字 + 衬线 h1、chip 云用 1px 线分隔，不再包卡片；CtaBand 收尾。
import type { PageResult, TagItem } from '~/types/blog'

const route = useRoute()
const router = useRouter()
const keyword = computed(() => String(route.query.keyword || '').trim())
const input = ref(keyword.value)
watch(keyword, (v) => (input.value = v))

const { data } = await useAsyncData(
  `tags-${keyword.value}`,
  () =>
    $fetch<PageResult<TagItem>>('/api/blog/public/tags', {
      query: { pageNum: 1, pageSize: 200, ...(keyword.value ? { keyword: keyword.value } : {}) }
    }),
  { watch: [keyword] }
)

function submit() {
  const kw = input.value.trim()
  router.replace(kw ? { path: '/tags', query: { keyword: kw } } : { path: '/tags' })
}

useSeoMeta({ title: () => (keyword.value ? `标签 · ${keyword.value}` : '全部标签') })
</script>

<template>
  <div class="space-y-12">
    <section>
      <header class="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">01 // INDEX</p>
          <h1 class="mt-3 font-serif text-2xl font-bold tracking-[var(--ls-h1)] md:text-3xl">
            {{ keyword ? `标签：${keyword}` : '全部标签' }}
          </h1>
          <p class="mt-2 font-mono text-xs uppercase tracking-[0.08em] text-dim">
            共 {{ data?.total ?? 0 }} 个标签
          </p>
        </div>
        <!-- 一体化搜索框（sd-search）：放大镜 + 输入 + 内嵌按钮共享圆角与 focus ring -->
        <form class="sd-search w-full sm:w-72" @submit.prevent="submit">
          <span class="i-mdi:magnify shrink-0 text-dim" aria-hidden="true" />
          <input v-model="input" type="search" placeholder="按名称或 slug 过滤" />
          <SdButton type="submit" size="sm">过滤</SdButton>
        </form>
      </header>

      <div class="mt-8 flex flex-wrap gap-2">
        <TagChip v-for="t in data?.rows" :key="t.tagId" :slug="t.slug" :name="t.name" />
        <p v-if="!data?.rows?.length" class="text-sm text-muted">没有匹配的标签</p>
      </div>
    </section>

    <CtaBand />
  </div>
</template>
