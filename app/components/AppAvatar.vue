<script setup lang="ts">
// 头像：有 avatarUrl 用图片，否则用品牌渐变圆 + 首字母（全站 header / 文章 meta / 评论 / 用户页复用）。
const props = withDefaults(defineProps<{ name?: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }>(), {
  name: '',
  src: null,
  size: 'md'
})

const sizeCls = computed(
  () => ({ sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' })[props.size]
)
const initial = computed(() => (props.name || '?').trim().charAt(0).toUpperCase() || '?')
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="name"
    class="shrink-0 rounded-full object-cover"
    :class="sizeCls"
  />
  <span
    v-else
    class="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-strong font-bold text-primary-ink"
    :class="sizeCls"
    aria-hidden="true"
  >
    {{ initial }}
  </span>
</template>
