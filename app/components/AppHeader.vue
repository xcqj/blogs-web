<script setup lang="ts">
// 全站顶栏（design/shell.html 基线 + design/responsive.html 断点表）：
// md+ 文字导航；<768 收进汉堡（xs/sm 行）。右侧操作区随登录态变化——登录才显示「作者中心」(D29)。
const { logged, profile, logout } = useAuth()
const { show: showLogin } = useLoginModal()
// 下滑隐藏顶栏、上滑立即出现（M11）；CSS 已限制为仅 <768 生效
const { hideHeader } = useScrollDirection()

const route = useRoute()
const nav = [
  { label: '首页', to: '/' },
  { label: '标签', to: '/tags' },
  { label: '搜索', to: '/search' },
  { label: '关于', to: '/about' }
]

const menuOpen = ref(false)
// 路由变化即收起移动菜单
watch(() => route.fullPath, () => (menuOpen.value = false))
</script>

<template>
  <header class="site-header sticky top-0 z-50 border-b border-border bg-surface" :class="{ 'is-hidden': hideHeader }">
    <!-- 顶栏版心比正文更宽（Stitch：max-w-1440 + 左右 24/48），正文容器 1180——
         两者不同是刻意的：导航铺开，内容收窄 -->
    <div class="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-6 lg:px-12">
      <!-- 左组：站名 + 站点导航（Stitch 顶栏口径：导航紧跟站名，不居中也不靠右） -->
      <div class="flex min-w-0 items-center gap-6 lg:gap-12">
        <AppBrand />

        <nav class="hidden items-center gap-6 md:flex" aria-label="站点导航">
          <!-- 激活语言（方向 C）：2px 全宽下边框 + 主色，用 scaleX 过渡避免逐帧重排；
               hover 与 active 同一套几何，不做混搭 -->
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="border-b-2 border-transparent pb-0.5 text-[13px] text-muted transition-colors hover:border-primary hover:text-text"
            active-class="!border-primary !text-text !font-medium"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- 右组：主题 + 登录态 -->
      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        <!-- 主题切换：仅桌面出现在顶栏；窄屏收进下方抽屉菜单 -->
        <div class="hidden md:block">
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
        </div>

        <template v-if="logged">
          <!-- 窄屏：作者中心与退出收进抽屉，顶栏只留头像（省空间、避免拥挤） -->
          <NuxtLink
            to="/me"
            class="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-primary hover:text-text md:flex"
          >
            <span class="i-mdi:pencil-box-outline" aria-hidden="true" />作者中心
          </NuxtLink>
          <NuxtLink :to="profile?.userId ? `/user/${profile.userId}` : '/me'" class="flex items-center gap-2">
            <AppAvatar :name="profile?.nickName" :src="profile?.avatarUrl" size="sm" />
            <span class="hidden text-sm sm:inline">{{ profile?.nickName || '已登录' }}</span>
          </NuxtLink>
          <button class="hidden text-xs text-muted transition hover:text-text md:inline" @click="logout">退出</button>
        </template>
        <!-- 登录钮：方向 C 改为「1px 边框 + 透明底」（Stitch 顶栏口径 border rgba(17,17,17,.18)）。
             之前用 soft 淡蓝实底，在纯白顶栏上是一块很抢眼的色块，与"导航轻、内容重"的层级相反。 -->
        <SdRollButton v-else label="登录" variant="secondary" @click="showLogin" />

        <!-- 移动汉堡按钮（<768） -->
        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted transition hover:border-primary hover:text-text md:hidden"
          :aria-expanded="menuOpen"
          aria-label="打开导航菜单"
          @click="menuOpen = !menuOpen"
        >
          <span :class="menuOpen ? 'i-mdi:close' : 'i-mdi:menu'" class="text-lg" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- 移动菜单面板 -->
    <nav v-if="menuOpen" class="border-t border-border bg-surface md:hidden">
      <div class="sd-wrap flex flex-col py-2">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="py-2.5 text-sm text-muted transition hover:text-text"
          active-class="!text-text font-semibold"
        >
          {{ item.label }}
        </NuxtLink>
        <template v-if="logged">
          <NuxtLink to="/me" class="flex items-center gap-1.5 py-2.5 text-sm text-muted transition hover:text-text">
            <span class="i-mdi:pencil-box-outline" aria-hidden="true" />作者中心
          </NuxtLink>
          <NuxtLink to="/me/profile" class="flex items-center gap-1.5 py-2.5 text-sm text-muted transition hover:text-text">
            <span class="i-mdi:account-circle-outline" aria-hidden="true" />个人资料
          </NuxtLink>
          <button class="py-2.5 text-left text-sm text-muted transition hover:text-text" @click="logout">
            退出登录
          </button>
        </template>
        <!-- 窄屏：主题切换收在菜单内 -->
        <div class="mt-2 border-t border-border py-3">
          <ClientOnly>
            <ThemeToggle />
          </ClientOnly>
        </div>
      </div>
    </nav>
  </header>
</template>
