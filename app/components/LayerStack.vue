<script setup lang="ts">
// 品牌母题「错位纵深叠层」的可复用组件——logo（AppBrand 叠框）/ 空态（EmptyState 叠框）/
// Hero 叠层 / CTA 收尾叠层同族，收敛到这一个是避免将来多处复制漂移（AGENTS 设计规则：该封装就封装）。
// - 纯 CSS 3D：perspective + translateZ 阶梯 + rotateX(58deg) rotateZ(45deg)，无 JS、无依赖
// - 层数/边长/层距/透明度全部 props 化，尺寸经 CSS 自定义属性下发，不写魔法数字
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
}>(), {
  layers: 5,
  size: 96,
  zStep: 30,
  baseOpacity: 0.3,
  secondary: false,
  secondarySize: 72,
  secondaryOpacity: 0.3
})

// 第 i 层（1..layers）：Z 步进制造纵深，透明度线性爬升到 1
const layerStyle = (i: number) => ({
  transform: `translateZ(${(i - 1) * props.zStep}px)`,
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
    :style="{ '--ls-size': `${size}px`, '--ls-secondary-size': `${secondarySize}px` }"
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
}

.stack {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--ls-size);
  height: var(--ls-size);
  margin: calc(var(--ls-size) / -2) 0 0 calc(var(--ls-size) / -2);
  transform-style: preserve-3d;
  transform: rotateX(58deg) rotateZ(45deg);
}

/* 副叠层：缩小 + 低透明度 + 沿对角线偏移——读作「从主栈滑出」，而不是漂浮的方块。
   <lg 只留主栈（原 HeroVisual 口径：次要叠层位移在 md 档会被裁切） */
.stack--secondary {
  top: 58%;
  width: var(--ls-secondary-size);
  height: var(--ls-secondary-size);
  margin: calc(var(--ls-secondary-size) / -2) 0 0 calc(var(--ls-secondary-size) / -2 + 28px);
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
}
</style>
