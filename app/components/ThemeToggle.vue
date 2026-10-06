<script setup lang="ts">
// 深浅主题切换（桶A 第2点）。依赖 @nuxtjs/color-mode：偏好写 cookie，SSR 首屏无闪烁。
// 水合安全：SSR 阶段 value 未定，mounted 后才渲染真实图标/文案；使用处再以 <ClientOnly> 包裹。
const colorMode = useColorMode()
const mounted = ref(false)
const isLight = computed(() => mounted.value && colorMode.value === 'light')

onMounted(() => {
  mounted.value = true
})

function toggle() {
  colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <button
    type="button"
    class="flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs text-text transition hover:border-primary"
    :aria-label="isLight ? '切换到深色' : '切换到浅色'"
    @click="toggle"
  >
    <span :class="isLight ? 'i-mdi:white-balance-sunny' : 'i-mdi:moon-waning-crescent'" aria-hidden="true" />
    <span>{{ isLight ? '浅色' : '深色' }}</span>
  </button>
</template>
