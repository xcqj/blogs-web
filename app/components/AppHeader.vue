<script setup lang="ts">
// 全站顶栏（design/shell.html 基线）：sticky + surface + 下边框；导航静态 3 项；
// 右侧操作区随登录态变化——登录才显示「作者中心」入口（D29），MVP 不做头像下拉菜单。
const { logged, profile, logout } = useAuth()
const { show: showLogin } = useLoginModal()

const nav = [
  { label: '首页', to: '/' },
  { label: '标签', to: '/tags' },
  { label: '搜索', to: '/search' }
]
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-border bg-surface">
    <div class="sd-wrap flex h-16 items-center justify-between gap-4">
      <AppBrand />

      <div class="flex items-center gap-4">
        <nav class="hidden items-center gap-5 text-sm md:flex">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="text-muted transition hover:text-text"
            active-class="!text-text font-semibold"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <ClientOnly>
          <ThemeToggle />
        </ClientOnly>

        <template v-if="logged">
          <NuxtLink
            to="/me"
            class="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-primary hover:text-text sm:flex"
          >
            <span class="i-mdi:pencil-box-outline" aria-hidden="true" />作者中心
          </NuxtLink>
          <NuxtLink :to="profile?.userId ? `/user/${profile.userId}` : '/me'" class="flex items-center gap-2">
            <AppAvatar :name="profile?.nickName" :src="profile?.avatarUrl" size="sm" />
            <span class="hidden text-sm sm:inline">{{ profile?.nickName || '已登录' }}</span>
          </NuxtLink>
          <button class="text-xs text-muted transition hover:text-text" @click="logout">退出</button>
        </template>
        <button v-else class="btn-primary !px-4 !py-1.5 !text-xs" @click="showLogin">登录</button>
      </div>
    </div>
  </header>
</template>
