<script setup lang="ts">
// CTA band（页面收尾行动区，yuanpu sirene 结构特征）：暖纸克制风——elevated 面 + 强边框，
// 黄色 CTA 按钮作唯一焦点（--cta 签名用法：主行动按钮黄底黑字，不做大色块；2026-10-13 用户反馈
// 整块黄太跳后改）。纯静态链接不调接口；/me/new 由既有 useRequireAuth 守卫处理未登录跳转。
// 2026-10-16 二轮精修：标题下方加品牌母题缩微叠层（静态分量补「面板太空」——用户否决了
// 三维倾斜动效，选静态补分量；不动效、零依赖）。全站 6 个复用页一致的收尾签名。
</script>

<template>
  <section v-reveal class="rounded-xl border border-border-strong bg-elevated px-6 py-12 text-center md:py-16">
    <h2 class="text-2xl font-bold tracking-[var(--ls-h2)] md:text-3xl">下一篇，从你开始</h2>
    <!-- 收尾签名：缩微叠层（4 层 / 56px 单层 / zStep 12，光学约 80px，对应用户批准的 64–80px 档）。
         低透明度不抢黄 CTA 焦点；纯静态 SSR 友好；包裹层承接尺寸类，避免与组件内 height:100% 冲突 -->
    <div class="mx-auto mt-5 h-20 w-20">
      <LayerStack :layers="4" :size="56" :z-step="12" :base-opacity="0.22" />
    </div>
    <p class="mx-auto mt-4 max-w-[52ch] text-sm text-muted md:text-base">
      注册即可发文。把你在源码里读到的深度，写给更多读者。
    </p>
    <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <SdButton variant="cta" to="/me/new" size="lg">开始写作 →</SdButton>
      <SdButton variant="secondary" to="/tags" size="lg">逛标签</SdButton>
    </div>
  </section>
</template>
