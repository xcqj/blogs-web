<script setup lang="ts">
// 基础按钮：语义化封装 uno.config 的 btn-* shortcut 家族（样式零新增，全部走 token）。
// - variant × size 与 shortcut 一一对应；传 to 渲染 NuxtLink、href 渲染 a，否则 button
// - button 形态默认 type="button"（防 form 内误提交；要提交显式传 type="submit"）
// - loading 出 spinner 并禁点；移动端 44px 触控规则作用在 btn-* 类名上，天然继承
interface Props {
  variant?: 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), { variant: 'primary', size: 'md', type: 'button' })

const variantCls: Record<NonNullable<Props['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  cta: 'btn-cta',
  ghost: 'btn-ghost',
  danger: 'btn-danger'
}
const sizeCls: Record<NonNullable<Props['size']>, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

// resolveComponent 是 Vue 官方在 setup 里拿自动导入组件的方式（SSR/CSR 均安全）
const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : props.href ? 'a' : 'button'))
const isLink = computed(() => !!(props.to || props.href))
const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :type="isLink ? undefined : type"
    :disabled="isLink ? undefined : isDisabled"
    :aria-busy="loading || undefined"
    :class="[variantCls[variant], sizeCls[size], block ? 'w-full' : '']"
  >
    <span v-if="loading" class="i-mdi:loading animate-spin" aria-hidden="true" />
    <slot />
  </component>
</template>
