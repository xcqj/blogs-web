<script setup lang="ts">
// 数字分页（design/app.css .pager 基线；§2.8 锁定「全站列表统一数字分页，不做无限滚动」）。
// linkFor 由调用方决定路由形态：/page/{n} 用路径，标签/搜索/用户页用 query。
const props = defineProps<{
  page: number
  total: number
  pageSize: number
  linkFor: (n: number) => string | Record<string, any>
}>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// 窗口化页码：首尾恒显，当前页 ±2，缺口用 0 作省略号占位
const items = computed(() => {
  const last = pageCount.value
  const cur = props.page
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const set = new Set([1, last, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= last))
  const sorted = [...set].sort((a, b) => a - b)
  const out: number[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(0) // 0 = 省略号
    out.push(n)
  })
  return out
})
</script>

<template>
  <nav v-if="pageCount > 1" class="my-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="分页">
    <NuxtLink
      v-if="page > 1"
      :to="linkFor(page - 1)"
      class="pager-btn"
      rel="prev"
      aria-label="上一页"
    >
      <span class="i-mdi:chevron-left" aria-hidden="true" />
    </NuxtLink>

    <template v-for="(n, i) in items" :key="`p-${i}`">
      <span v-if="n === 0" class="px-1 text-muted">…</span>
      <NuxtLink v-else :to="linkFor(n)" class="pager-btn" :aria-current="n === page ? 'page' : undefined" :class="n === page && 'pager-btn--on'">
        {{ n }}
      </NuxtLink>
    </template>

    <NuxtLink
      v-if="page < pageCount"
      :to="linkFor(page + 1)"
      class="pager-btn"
      rel="next"
      aria-label="下一页"
    >
      <span class="i-mdi:chevron-right" aria-hidden="true" />
    </NuxtLink>
  </nav>
</template>

<style scoped>
.pager-btn {
  display: inline-flex;
  min-width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
  font-size: var(--text-sm);
  transition: 0.15s;
}
.pager-btn:hover {
  border-color: var(--accent);
  color: var(--text);
}
.pager-btn--on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}
</style>
