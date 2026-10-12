<script setup lang="ts">
// CTA band（页面收尾行动区，yuanpu sirene 结构特征）：暖纸克制风——elevated 面 + 强边框，
// 黄色 CTA 按钮作唯一焦点（--cta 签名用法：主行动按钮黄底黑字，不做大色块；2026-10-13 用户反馈
// 整块黄太跳后改）。纯静态链接不调接口；/me/new 由既有 useRequireAuth 守卫处理未登录跳转。
</script>

<template>
  <section v-reveal class="rounded-xl border border-border-strong bg-elevated px-6 py-12 text-center md:py-16">
    <h2 class="text-2xl font-bold tracking-[var(--ls-h2)] md:text-3xl">下一篇，从你开始</h2>
    <p class="mx-auto mt-4 max-w-[52ch] text-sm text-muted md:text-base">
      注册即可发文。把你在源码里读到的深度，写给更多读者。
    </p>
    <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <SdButton variant="cta" to="/me/new" size="lg">开始写作 →</SdButton>
      <SdButton variant="secondary" to="/tags" size="lg">逛标签</SdButton>
    </div>
  </section>
</template>
