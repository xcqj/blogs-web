<script setup lang="ts">
// 文章目录（S27）：宽屏右侧 sticky、窄屏 details 折叠。两种形态共用一份列表与高亮逻辑。
import type { TocItem } from '~/utils/toc'

const props = withDefaults(defineProps<{
  items: TocItem[]
  /** aside = 宽屏右栏；inline = 窄屏正文上方折叠 */
  variant?: 'aside' | 'inline'
}>(), { variant: 'aside' })

const activeId = ref('')

// 当前小节高亮：只影响客户端视觉，不影响 SSR 输出
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!props.items.length || typeof IntersectionObserver === 'undefined') return

  const targets = props.items
    .map((i) => document.getElementById(i.id))
    .filter((el): el is HTMLElement => !!el)

  if (!targets.length) return

  observer = new IntersectionObserver(
    (entries) => {
      // 顶部窄带（顶栏 80px 以下、视口 30% 以内）里的标题视为「当前小节」，
      // 多个同时命中时取最靠上的那个，避免滚动过程中来回跳。
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length) {
        activeId.value = visible[0].target.id
      }
    },
    { rootMargin: '-80px 0px -70% 0px' }
  )

  targets.forEach((t) => observer!.observe(t))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

function linkClass(item: TocItem): string {
  const base = 'block border-l py-1 pl-3 text-[13px] leading-[1.9] transition-colors duration-150'
  const indent = item.level === 3 ? 'pl-6' : 'pl-3'
  const state = activeId.value === item.id
    ? 'border-primary text-primary-fg'
    : 'border-transparent text-muted hover:text-text'
  return [base, indent, state].join(' ')
}
</script>

<template>
  <!-- 窄屏：原生折叠，默认收起，不抢首屏注意力 -->
  <details v-if="variant === 'inline'" class="group mt-6 border-y border-border py-3">
    <summary class="flex cursor-pointer list-none items-center justify-between font-mono text-xs uppercase tracking-[0.08em] text-dim">
      <span>本文目录</span>
      <span class="text-sm transition-transform duration-150 group-open:rotate-45" aria-hidden="true">+</span>
    </summary>
    <ul class="mt-3 list-none space-y-1 p-0">
      <li v-for="item in items" :key="item.id">
        <a :href="`#${item.id}`" class="block py-0.5 text-[13px] leading-[1.9] text-muted hover:text-text">
          {{ item.text }}
        </a>
      </li>
    </ul>
  </details>

  <!-- 宽屏：右侧吸顶 -->
  <nav v-else aria-label="文章目录" class="text-sm">
    <p class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-dim">
      <span class="inline-block h-px w-6 bg-primary" aria-hidden="true" />
      本文目录
    </p>
    <ul class="mt-3 list-none p-0">
      <li v-for="item in items" :key="item.id">
        <a :href="`#${item.id}`" :class="linkClass(item)">{{ item.text }}</a>
      </li>
    </ul>
  </nav>
</template>
