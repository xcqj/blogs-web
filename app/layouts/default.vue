<template>
  <!-- 全站默认布局（design/shell.html）：宽档容器 1080；正文页在自身内部再收 68ch 窄档 -->
  <div class="flex min-h-screen flex-col bg-bg text-text">
    <AppHeader />
    <main class="sd-wrap flex-1 py-8">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <LoginModal />
    </ClientOnly>
  </div>
</template>
