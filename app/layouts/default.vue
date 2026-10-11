<template>
  <!-- 全站默认布局（design/shell.html）：宽档容器 1080；正文页在自身内部再收 68ch 窄档 -->
  <div class="flex min-h-screen flex-col text-text">
    <!-- 背景漂移层：fixed z-0，内容侧由 main/footer 的 relative z-10 压住 -->
    <BgDrift />
    <AppHeader />
    <main class="sd-wrap relative z-10 flex-1 py-8">
      <slot />
    </main>
    <div class="relative z-10"><AppFooter /></div>
    <ClientOnly>
      <LoginModal />
    </ClientOnly>
  </div>
</template>
