<script setup lang="ts">
// 品牌母题「错位纵深叠层」的可复用组件——logo（AppBrand 叠框）/ 空态（EmptyState 叠框）/
// Hero 叠层 / CTA 收尾叠层同族，收敛到这一个是避免将来多处复制漂移（AGENTS 设计规则：该封装就封装）。
// - 纯 CSS 3D：perspective + translateZ 阶梯 + rotateX(58deg) rotateZ(45deg)，无 JS、无依赖
// - 层数/边长/层距/透明度/副栈/光学中心校正全部 props 化，经 CSS 自定义属性下发，不写魔法数字
// - 响应式：<lg 档内置尺寸缩放（--ls-ss .72）与 Z 步进缩放（--ls-zs .6）——md 档 hero 面板更矮，
//   不缩放叠层必被面板 overflow-hidden 裁切（三轮精修实测 768/820 档裁 102px）
// - offsetY：3D 投影的质心不在容器几何中心（高层级向上展开更多），用下移量校正顶部裁切与骑高
// - 纯静态渲染（SSR 友好，无 JS 时照常显示）；装饰性图形，aria-hidden
const props = withDefaults(defineProps<{
  /** 主叠层数（默认 5：原 6 层精简档位） */
  layers?: number
  /** 单层边长 px（默认 96） */
  size?: number
  /** 层间 Z 步进 px（默认 30：拉开才读得出「一层层」） */
  zStep?: number
  /** 最底层透明度（默认 .3，向上渐实——「越深越实」的隐喻） */
  baseOpacity?: number
  /** 副叠层开关（沿主栈对角线「滑出」的暗示） */
  secondary?: boolean
  /** 副叠层边长 px */
  secondarySize?: number
  /** 副叠层透明度 */
  secondaryOpacity?: number
  /** 叠层光学中心相对容器几何中心的下移量 px（默认 0）。
   *  3D 投影质心系统性偏高（translateZ 高层级向上展开更多），不校正会被面板裁顶；
   *  CTA 等小尺寸场景不传即零影响 */
  offsetY?: number
}>(), {
  layers: 5,
  size: 96,
  zStep: 30,
  baseOpacity: 0.3,
  secondary: false,
  secondarySize: 72,
  secondaryOpacity: 0.3,
  offsetY: 0
})

// 每层只内联层序 --i 与透明度；transform 走 CSS（calc(var(--i) * var(--ls-z) * var(--ls-zs))）——
// 内联 transform 无法被媒体查询缩放，响应式防裁切必须走变量
const layerStyle = (i: number) => ({
  '--i': i - 1,
  opacity: String(
    props.layers > 1
      ? props.baseOpacity + ((i - 1) * (1 - props.baseOpacity)) / (props.layers - 1)
      : 1
  )
})
</script>

<template>
  <div
    class="layer-stack"
    :style="{
      '--ls-size': `${size}px`,
      '--ls-secondary-size': `${secondarySize}px`,
      '--ls-z': `${zStep}px`,
      '--ls-offset': `${offsetY}px`
    }"
    aria-hidden="true"
  >
    <div v-if="secondary" class="stack stack--secondary" :style="{ opacity: String(secondaryOpacity) }">
      <span v-for="i in 2" :key="`s${i}`" class="layer" :style="layerStyle(i)" />
    </div>
    <div class="stack">
      <span v-for="i in layers" :key="`m${i}`" class="layer" :style="layerStyle(i)" />
    </div>
  </div>
</template>

<style scoped>
.layer-stack {
  position: relative;
  height: 100%;
  min-height: 80px;
  perspective: 1100px;
  /* 响应式缩放因子：默认 1；<lg 面板更矮，整体缩到 72%、Z 步进缩到 60%（实测防裁切档），
     offsetY 同步缩到 60%（缩放后投影不对称量也同比缩小，实测 27/44≈0.61 取 0.6） */
  --ls-ss: 1;
  --ls-zs: 1;
  --ls-oss: 1;
}

@media (max-width: 1023px) {
  .layer-stack {
    --ls-ss: 0.72;
    --ls-zs: 0.6;
    --ls-oss: 0.6;
  }
}

.stack {
  position: absolute;
  /* top 消费 offsetY（×响应式缩放）：校正 3D 投影质心偏高（不校正则叠层顶边被面板 overflow-hidden 裁掉） */
  top: calc(50% + var(--ls-offset, 0px) * var(--ls-oss, 1));
  left: 50%;
  width: calc(var(--ls-size) * var(--ls-ss));
  height: calc(var(--ls-size) * var(--ls-ss));
  margin: calc(var(--ls-size) * var(--ls-ss) / -2) 0 0 calc(var(--ls-size) * var(--ls-ss) / -2);
  transform-style: preserve-3d;
  transform: rotateX(58deg) rotateZ(45deg);
}

/* 副叠层：缩小 + 低透明度 + 沿对角线偏移——读作「从主栈滑出」，而不是漂浮的方块。
   <lg 只留主栈（次要叠层位移在 md 档会被裁切） */
.stack--secondary {
  top: calc(58% + var(--ls-offset, 0px) * var(--ls-oss, 1));
  width: calc(var(--ls-secondary-size) * var(--ls-ss));
  height: calc(var(--ls-secondary-size) * var(--ls-ss));
  margin: calc(var(--ls-secondary-size) * var(--ls-ss) / -2) 0 0 calc(var(--ls-secondary-size) * var(--ls-ss) / -2 + 28px);
}

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
  /* Z 步进：层序 × zStep × 响应式缩放（变量驱动才能被 <lg 媒体查询收敛） */
  transform: translateZ(calc(var(--i, 0) * var(--ls-z) * var(--ls-zs)));
}
</style>
