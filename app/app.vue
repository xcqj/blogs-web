<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- 反馈体系出口（L3）：全站各一处，任意页面/组件调用 useToast()/useConfirm() 即可。
       两者只在客户端事件回调里产生内容，SSR 期间恒为空，故不必套 ClientOnly -->
  <AppToaster />
  <AppConfirmDialog />
</template>
