<script setup lang="ts">
const { logged, profile } = useAuth()
const { show: showLogin } = useLoginModal()
const siteName = useRuntimeConfig().public.siteName

const nav = [
  { label: '首页', to: '/' },
  { label: '搜索', to: '/search' }
]
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <NuxtLink to="/" class="text-lg font-bold text-primary">
        {{ siteName }}
      </NuxtLink>

      <nav class="flex items-center gap-4 text-sm">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="text-gray-600 hover:text-primary"
          active-class="text-primary font-medium"
        >
          {{ item.label }}
        </NuxtLink>

        <template v-if="logged">
          <span class="flex items-center gap-1 text-gray-700">
            <span class="i-mdi:account-circle text-xl" />
            {{ profile?.nickName || '已登录' }}
          </span>
        </template>
        <button v-else class="rounded bg-primary px-3 py-1 text-white hover:opacity-90" @click="showLogin">
          登录
        </button>
      </nav>
    </div>
  </header>
</template>
