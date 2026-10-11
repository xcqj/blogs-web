<script setup lang="ts">
// 背景漂移层（打磨轮 7，借鉴 jason.blog marginalia 主题的 drift-layer，实测其实现后移植）：
// fixed 全屏层 + 若干品牌「种子」（叠框轮廓 = logo/空态母题；柔光圆 = 氛围），随滚动各按
// 不同速度漂移、在各自的滚动窗口内淡入淡出——下滑渐入、回滚反向重放，即「背景联动」。
// - fixed z-0 + pointer-events:none：永远在内容下、不拦截交互（内容由 layout 的 relative z-10 承载）
// - 纯滚动驱动：位置/摆动相位都挂滚动进度 p，静止即完全静止（省电）；只写 transform/opacity 走合成器
// - prefers-reduced-motion：不做滚动驱动，种子恒定低透明度静置
// - <md 隐藏：窄屏几乎全是阅读区，无边缘可漂移，还省性能
// - SSR 安全：种子静态定位可 SSR 输出（初始 opacity:0），浏览器 API 只在 onMounted

interface Seed {
  xw: number    // 基础 x（视口宽百分比，限制在两侧边缘带，避开正文 68ch）
  yBase: number // 基础 y（视口高百分比，left/top 静态定位，resize 天然自适应）
  size: number  // px
  speed: number // 滚动视差系数（正负混合，速度差产生前后层次）
  sway: number  // 横向摆动幅度 px（相位挂滚动进度，非时间——静止即停）
  phase: number // 摆动相位 / 旋转角基数
  from: number  // 淡入窗口起点（文档滚动进度 0~1）
  to: number    // 淡出窗口终点
  peak: number  // 窗口内峰值透明度（柔光圆可略高，轮廓框更低）
}

const SEEDS: Seed[] = [
  // 两个大柔光圆：氛围底
  { xw: 0.06, yBase: 0.30, size: 170, speed: 0.10,  sway: 60, phase: 0.0, from: 0.00, to: 0.45, peak: 0.5 },
  { xw: 0.93, yBase: 0.55, size: 200, speed: -0.08, sway: 70, phase: 1.8, from: 0.30, to: 0.80, peak: 0.42 },
  // 四个叠框轮廓：品牌母题的节奏点
  { xw: 0.10, yBase: 0.72, size: 96, speed: 0.16,  sway: 40, phase: 0.6, from: 0.15, to: 0.60, peak: 0.3 },
  { xw: 0.90, yBase: 0.16, size: 72, speed: -0.14, sway: 34, phase: 2.4, from: 0.05, to: 0.40, peak: 0.26 },
  { xw: 0.04, yBase: 0.12, size: 56, speed: 0.22,  sway: 26, phase: 4.1, from: 0.45, to: 0.85, peak: 0.24 },
  { xw: 0.96, yBase: 0.84, size: 88, speed: -0.18, sway: 30, phase: 3.2, from: 0.55, to: 1.00, peak: 0.28 }
]

const layerEl = ref<HTMLElement | null>(null)
const seedEls = ref<(HTMLElement | null)[]>([])
let raf = 0
let reduced = false

function paint() {
  raf = 0
  if (!layerEl.value) return
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  const h = window.innerHeight
  SEEDS.forEach((s, i) => {
    const el = seedEls.value[i]
    if (!el) return
    // 透明度：在自己的滚动窗口内走半波正弦（入 0 → 峰值 → 出 0）
    const t = (p - s.from) / (s.to - s.from)
    const o = t <= 0 || t >= 1 ? 0 : s.peak * Math.sin(t * Math.PI)
    // 位置：横向慢摆（相位=滚动进度），纵向按视差系数反向/正向游走
    const x = Math.sin(p * Math.PI * 2 + s.phase) * s.sway
    const y = (p - 0.5) * h * s.speed * 2.4
    el.style.opacity = o.toFixed(3)
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(s.phase * 40).toFixed(1)}deg)`
  })
}

function requestPaint() {
  if (!raf) raf = requestAnimationFrame(paint)
}

/** reduced-motion：不驱动，种子恒定半透明静置（可感知品牌点缀，但不移动） */
function staticPaint() {
  SEEDS.forEach((s, i) => {
    const el = seedEls.value[i]
    if (!el) return
    el.style.opacity = (s.peak * 0.5).toFixed(3)
    el.style.transform = `rotate(${(s.phase * 40).toFixed(1)}deg)`
  })
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    staticPaint()
    return
  }
  addEventListener('scroll', requestPaint, { passive: true })
  addEventListener('resize', requestPaint)
  requestPaint()
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  removeEventListener('scroll', requestPaint)
  removeEventListener('resize', requestPaint)
})
</script>

<template>
  <div ref="layerEl" class="bg-drift" aria-hidden="true">
    <!-- 纸纹：极淡噪点，让「暖纸」有颗粒而不是一块平色（灰噪点 + 3.5% 透明度，深浅通用） -->
    <div class="bg-grain" />
    <div
      v-for="(s, i) in SEEDS"
      :key="i"
      :ref="(el) => (seedEls[i] = el as HTMLElement | null)"
      class="seed"
      :class="s.size > 120 ? 'seed-glow' : 'seed-frame'"
      :style="{ left: `${s.xw * 100}%`, top: `${s.yBase * 100}%`, width: `${s.size}px`, height: `${s.size}px` }"
    />
  </div>
</template>

<style scoped>
.bg-drift {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
@media (max-width: 767px) {
  .bg-drift {
    display: none;
  }
}
.bg-grain {
  position: absolute;
  inset: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27160%27 height=%27160%27 filter=%27url(%23n)%27/%3E%3C/svg%3E");
}

.seed {
  position: absolute;
  opacity: 0; /* 初始不可见，透明度全由 JS 按滚动窗口驱动（SSR 首屏干净） */
  will-change: transform, opacity;
}
/* 柔光圆：accent 极低浓度径向渐隐 + blur，运动再快也是「雾」 */
.seed-glow {
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, color-mix(in srgb, var(--cta) 16%, transparent), transparent 70%);
  filter: blur(6px);
}
/* 叠框轮廓：品牌母题（logo/空态同款错位双框），颜色随深浅主题走 accent */
.seed-frame {
  border: 1.5px solid var(--accent);
  border-radius: var(--radius-lg);
}
.seed-frame::after {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1.5px solid var(--accent);
  border-radius: calc(var(--radius-lg) - 1px);
  opacity: 0.55;
}
</style>
