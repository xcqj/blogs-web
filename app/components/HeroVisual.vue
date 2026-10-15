<script setup lang="ts">
// 首页 Hero 视觉（design/home.html 的「错位纵深叠层」）：品牌母题的 hero 档表达，无 props。
// 叠层本体已收敛到 LayerStack 组件（logo/空态/CTA 同族），本组件只保留两件事：
// ① <ClientOnly> 槽位——three.js 动态漂浮层属桶B，只走这里注入，不进 SSR（D38 后暂不使用）
// ② hero 档参数：主栈 5 层 / 170px / zStep 30（原 6 层 / 140px / zStep 26——放大精简，
//    层间距拉开让「一层层读到深处」的隐喻可读）；副栈缩到 88px、透明度 .3 沿对角线滑出
</script>

<template>
  <div class="hero-visual" aria-hidden="true">
    <!-- 桶B 挂载点：<HomeHeroThreeLayers /> 将在此注入（仅客户端） -->
    <ClientOnly>
      <slot name="layers" />
    </ClientOnly>

    <LayerStack :size="170" :z-step="30" secondary :secondary-size="88" secondary-opacity="0.3" />
  </div>
</template>

<style scoped>
.hero-visual {
  position: relative;
  /* 高度由外层容器按断点控制（md 缩小 / lg 并排），组件自身跟随父高 */
  height: 100%;
  min-height: 140px;
}
</style>
