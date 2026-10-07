<script setup lang="ts">
// /tags —— 全站标签页（导航「标签」落点，§7.5 公共标签列表）。SSR 取数，chip 云 + 关键词过滤。
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
  <section>
    <header class="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">{{ keyword ? `标签：${keyword}` : '全部标签' }}</h1>
        <p class="mt-1 text-sm text-muted">共 {{ data?.total ?? 0 }} 个标签</p>
      </div>
      <form class="flex gap-2" @submit.prevent="submit">
        <input
          v-model="input"
          type="search"
          placeholder="按名称或 slug 过滤"
          class="sd-input w-56"
        />
        <button type="submit" class="btn-primary">过滤</button>
      </form>
    </header>

    <div class="flex flex-wrap gap-2">
      <TagChip v-for="t in data?.rows" :key="t.tagId" :slug="t.slug" :name="t.name" />
      <p v-if="!data?.rows?.length" class="text-sm text-muted">没有匹配的标签</p>
    </div>
  </section>
</template>
