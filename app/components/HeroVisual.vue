<script setup lang="ts">
// 首页 Hero 视觉（design/home.html 的「错位纵深叠层」静态复刻，桶A）。
// three.js 动态漂浮层属桶B：只走下面 <ClientOnly> 槽位注入，不进 SSR、不影响首屏与 SEO。
// 颜色仍取 var()，几何尺寸是装饰艺术本身、封装在本组件内不外溢到页面。
const layerStyle = (i: number) => ({
  transform: `translateZ(${(i - 1) * 26}px)`,
  opacity: String(Math.min(1, 0.35 + (i - 1) * 0.13))
})
</script>

<template>
  <div class="hero-visual" aria-hidden="true">
    <!-- 桶B 挂载点：<HomeHeroThreeLayers /> 将在此注入（仅客户端） -->
    <ClientOnly>
      <slot name="layers" />
    </ClientOnly>

    <div class="stack stack--secondary">
      <span v-for="i in 6" :key="`s${i}`" class="layer" :style="layerStyle(i)" />
    </div>
    <div class="stack">
      <span v-for="i in 6" :key="`m${i}`" class="layer" :style="layerStyle(i)" />
    </div>
  </div>
</template>

<style scoped>
.hero-visual {
  position: relative;
  /* 高度由外层容器按断点控制（md 缩小 / lg 并排），组件自身跟随父高 */
  height: 100%;
  min-height: 140px;
  perspective: 1100px;
}
.stack {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140px;
  height: 140px;
  margin: -70px 0 0 -70px;
  transform-style: preserve-3d;
  transform: rotateX(58deg) rotateZ(45deg);
}
.stack--secondary {
  width: 90px;
  height: 90px;
  margin: -45px 0 0 52px;
  opacity: 0.45;
}

/* md 档「堆叠缩小」：次要叠层位移会超出视口被裁切，lg 起才并排展示（design/responsive.html） */
@media (max-width: 1023px) {
  .stack--secondary {
    display: none;
  }
}
.layer {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--accent);
  background: var(--layer-fill);
  box-shadow: 0 0 26px var(--glow-soft), inset 0 0 18px var(--glow-soft);
}
</style>
