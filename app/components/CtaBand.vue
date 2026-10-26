<script setup lang="ts">
// 页面收尾行动区（方向 C，S23-T15 改编）。
// 旧版是「居中大面板 + 缩微叠框母题 + 黄 CTA」；方向 C 取消居中面板与叠框母题，
// 改为**左对齐 + 2px 主色横线起头**的编辑式收尾（与 SectionMark 的编号语言同族），
// 主行动按钮由黄 btn-cta 改为 --accent 实底（黄 CTA 已作废，D41）。
// 纯静态链接不调接口；/me/new 由既有 useRequireAuth 守卫处理未登录跳转。
</script>

<template>
  <section v-reveal class="border-t-2 border-primary pt-8">
    <h2 class="font-serif text-2xl font-bold tracking-[var(--ls-h2)] md:text-3xl">下一篇，从你开始</h2>
    <p class="mt-3 max-w-[52ch] text-sm text-muted md:text-base">
      注册即可发文。把你在源码里读到的深度，写给更多读者。
    </p>
    <div class="mt-6 flex flex-col gap-3 sm:flex-row">
      <SdButton to="/me/new">开始写作 →</SdButton>
      <SdButton to="/tags" variant="secondary">逛标签</SdButton>
    </div>
  </section>
</template>
