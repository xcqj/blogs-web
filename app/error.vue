<script setup lang="ts">
// 全站错误页（design/states.html ③④）：404 用渐变码 + 双按钮，其它状态码走 ErrorState。
// 不依赖 useAsyncData/布局，保证后端或数据链异常时也能渲染。
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error?.statusCode === 404)
const siteName = useRuntimeConfig().public.siteName
const route = useRoute()

useHead({ title: () => (is404.value ? `页面走丢了 · ${siteName}` : `出错了 · ${siteName}`) })

function retry() {
  // 清错误后回同一地址：不直接用 window/location（保持 SSR 安全），交给 navigateTo
  clearError()
  navigateTo(route.fullPath)
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-bg px-5 text-text">
    <div class="w-full max-w-md text-center">
      <div v-if="is404" class="code404">404</div>
      <ErrorState v-else :title="`出错了（${error?.statusCode || 500}）`" :description="error?.statusMessage || '服务暂不可用，请稍后重试。'" />

      <template v-if="is404">
        <h1 class="mt-3 text-lg font-semibold">页面走丢了</h1>
        <p class="mt-1 text-sm text-muted">你要找的内容不存在，或已被作者隐藏。</p>
      </template>

      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <SdButton to="/">回首页</SdButton>
        <SdButton to="/search" variant="ghost">去搜索</SdButton>
        <SdButton v-if="!is404" variant="ghost" @click="retry">重试</SdButton>
      </div>

      <div class="mt-10">
        <AppBrand />
      </div>
    </div>
  </div>
</template>

<style scoped>
.code404 {
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -2px;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
