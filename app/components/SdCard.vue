<script setup lang="ts">
// 基础卡片：封装 sd-card shortcut（surface + 半透明边 + e1 阴影），hover 选项升一级并上浮。
// padding 档位映射 token 间距（none/sm=p-4/md=p-5/lg=p-6），页面上不再散落 p-* 魔法值。
interface Props {
  as?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), { as: 'div', hover: false, padding: 'none' })

const padCls: Record<NonNullable<Props['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6'
}
</script>

<template>
  <component :is="as" class="sd-card" :class="[padCls[padding], hover ? 'card-hover' : '']">
    <slot />
  </component>
</template>
