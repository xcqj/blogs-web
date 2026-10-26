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
  { label: '搜索', to: '/search' }
]

const menuOpen = ref(false)
// 路由变化即收起移动菜单
watch(() => route.fullPath, () => (menuOpen.value = false))
</script>

<template>
  <header class="site-header sticky top-0 z-50 border-b border-border bg-surface" :class="{ 'is-hidden': hideHeader }">
    <div class="sd-wrap flex h-16 items-center justify-between gap-3">
      <AppBrand />

      <div class="flex shrink-0 items-center gap-2 sm:gap-3">
        <!-- 桌面导航 -->
        <nav class="hidden items-center gap-6 text-sm md:flex">
          <!-- 激活语言（方向 C，2026-10-26）：由「4px 短横线」改为「2px 全宽下边框 + 主色」，
               与冻结规格 §4.1 一致；用 scaleX 而非 width 过渡，避免逐帧重排。
               hover 时淡入同一条下边框（未激活为 0 宽），与激活态同一套几何，不做混搭 -->
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="relative py-1 text-muted transition-colors hover:text-text after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100"
            active-class="!text-text !font-medium after:!scale-x-100"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

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
        <!-- 登录钮降重量（清单7）：soft 半透明底替代 accent 实底，hover 才升实底；
             深色顶栏少一块高反光实底，重量让位内容（滚动字效保留） -->
        <SdRollButton v-else label="登录" variant="soft" @click="showLogin" />

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
