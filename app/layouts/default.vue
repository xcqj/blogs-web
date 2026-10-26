<template>
  <!-- 全站默认布局（规格见 design/stitch/README.md §4.1）：
       内容区最大宽 1100（tokens --container）、导航下留白 24px（py-6）。
       方向 C（2026-10-26，D41）移除 BgDrift 漂移层——C 版不要光斑/渐变氛围，
       纸面本身即背景；同时不再需要 z-10 压层。 -->
  <div class="flex min-h-screen flex-col text-text">
    <AppHeader />
    <main class="sd-wrap flex-1 py-6">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <LoginModal />
    </ClientOnly>
  </div>
</template>
