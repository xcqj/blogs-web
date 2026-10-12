<script setup lang="ts">
// CTA band（页面收尾高对比色块，yuanpu sirene 结构特征）：--cta 黄底 + 墨字（token 反相用法），
// 主按钮墨底黄字（btn-ink），次按钮墨描边、hover 反相为墨底黄字。
// 纯静态链接不调接口；/me/new 由既有 useRequireAuth 守卫处理未登录跳转。
</script>

<template>
  <section v-reveal class="rounded-xl bg-cta px-6 py-12 text-center text-cta-ink md:py-16">
    <h2 class="text-2xl font-bold tracking-[var(--ls-h2)] md:text-3xl">下一篇，从你开始</h2>
    <p class="mx-auto mt-4 max-w-[52ch] text-sm md:text-base">
      注册即可发文。把你在源码里读到的深度，写给更多读者。
    </p>
    <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <SdButton variant="ink" to="/me/new" size="lg">开始写作 →</SdButton>
      <NuxtLink
        to="/tags"
        class="btn btn-lg border border-cta-ink text-cta-ink hover:bg-cta-ink hover:text-cta"
      >
        逛标签
      </NuxtLink>
    </div>
  </section>
</template>
