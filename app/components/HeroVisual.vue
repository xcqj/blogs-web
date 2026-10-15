<script setup lang="ts">
// 首页 Hero 视觉（design/home.html 的「错位纵深叠层」）：品牌母题的 hero 档表达，无 props。
// 叠层本体已收敛到 LayerStack 组件（logo/空态/CTA 同族），本组件只保留两件事：
// ① <ClientOnly> 槽位——three.js 动态漂浮层属桶B，只走这里注入，不进 SSR（D38 后暂不使用）
// ② hero 档参数：主栈 5 层 / 170px / zStep 30（原 6 层 / 140px / zStep 26——放大精简，
//    层间距拉开让「一层层读到深处」的隐喻可读）；副栈缩到 88px、透明度 .3 沿对角线滑出；
//    offsetY 34px：三轮精修实测 3D 投影质心偏高，叠层顶边被面板 overflow-hidden 裁 15px、
//    底部空 74px——下移后顶/底 clearance 均衡（多视口实测调定）
// ③ client-only 指针视差（≤3°，二轮精修：用户明确选择的首屏「活物」感）：
//    - SSR 安全：全部逻辑在 onMounted 内（服务端不执行），模板零浏览器 API
//    - 双守卫：仅 (hover: hover) and (pointer: fine)（触屏不挂，免误触抖动）；
//      prefers-reduced-motion 完全跳过（与全局 0.01ms 兜底形成双保险）
//    - window 级 passive pointermove + rAF 节流；映射指针相对 hero 面板中心的位置到
//      ±3° 的 --tilt-x/--tilt-y，由 CSS transform 消费，200ms ease-out 形成平滑滞后
//    - onUnmounted 移除监听 + 取消未执行帧；<md 容器 hidden 时 rect 为 0，自然空转
const root = ref<HTMLElement>()
const MAX_TILT = 3 // deg：D38 动效收缩精神内的克制度

let raf = 0
function onPointerMove(e: PointerEvent) {
  const el = root.value
  if (!el) return
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return // 不可见（<md 隐藏）：零成本空转
    const clamp = (v: number) => Math.max(-1, Math.min(1, v))
    const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2))
    const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2))
    el.style.setProperty('--tilt-y', `${(nx * MAX_TILT).toFixed(2)}deg`)
    el.style.setProperty('--tilt-x', `${(-ny * MAX_TILT).toFixed(2)}deg`)
  })
}

onMounted(() => {
  if (typeof matchMedia !== 'function') return
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('pointermove', onPointerMove)
})
</script>

<template>
  <div ref="root" class="hero-visual" aria-hidden="true">
    <!-- 桶B 挂载点：<HomeHeroThreeLayers /> 将在此注入（仅客户端） -->
    <ClientOnly>
      <slot name="layers" />
    </ClientOnly>

    <LayerStack :size="170" :z-step="30" :offset-y="44" secondary :secondary-size="88" secondary-opacity="0.3" />
  </div>
</template>

<style scoped>
.hero-visual {
  position: relative;
  /* 高度由外层容器按断点控制（md 缩小 / lg 并排），组件自身跟随父高 */
  height: 100%;
  min-height: 140px;
  /* 指针视差消费端：--tilt-x/--tilt-y 由 onMounted 内的 client-only 监听写入，
     SSR 期不存在这两个变量，回退 0deg（无 JS 时同样静止）；preserve-3d 让子叠层
     的 3D 变换与本体旋转正确组合 */
  transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
  transform-style: preserve-3d;
  transition: transform var(--t) var(--ease-out);
}
</style>
