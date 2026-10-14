<template>
  <NuxtLayout>
    <!-- 路由页面过渡（M7）：out-in 避免新旧两页同时占据高度导致跳动；
         样式与 reduced-motion 兜底在 assets/css/transitions.css -->
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>
  <!-- 反馈体系出口（L3）：全站各一处，任意页面/组件调用 useToast()/useConfirm() 即可。
       两者只在客户端事件回调里产生内容，SSR 期间恒为空，故不必套 ClientOnly -->
  <AppToaster />
  <AppConfirmDialog />
  <!-- PWA（S17）：@vite-pwa/nuxt Nuxt 4 模式需显式挂载才会注入 <link rel="manifest">；
       SW 注册由模块自带 client 插件（pwa.client，useRegisterSW immediate）自动完成，无需手写 -->
  <VitePwaManifest />
</template>
