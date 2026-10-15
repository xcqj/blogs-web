// 全站平滑惯性滚动（S20 · ROADMAP v0.4 / D38：动效收缩后仅保留 Lenis，不引 three.js / GSAP）。
// .client 后缀保证 SSR 安全红线：Lenis 是纯浏览器库，插件仅在浏览器执行，服务端 bundle 不含、
// 首屏零成本；改动仅本文件 + CSS 一段 + 依赖一个，随时可整体插拔。
//
// ⚠️ 坑（2026-10-15 实测，本项目 Nuxt 4.6）：app/plugins 下 bare 包的**静态默认导入会被
// auto-import transform（unimport）整体剥离**——产物里 import 语句消失、`new Lenis(...)`
// 变成自由标识符，运行时报 "Lenis is not defined" 直接白屏（错误页）。改用**动态 import**
// （unimport 不触碰动态导入，且顺带把 lenis 拆成独立 chunk）；同类场景一律照此办。
//
// 两处刻意的设计：
// 1. reduced-motion 门控用「不初始化」而非 stop()——已核实 Lenis 1.3.26 源码：自带的
//    respectReducedMotion 选项只让 programmatic scrollTo 变 immediate，并不禁用滚轮平滑；
//    stop() 还会留下 lenis-stopped 类与 overflow 处理。偏好匹配时完全不创建实例，html 上
//    无任何 lenis-* class，原生滚动原样回退（transitions.css 的全站 reduce 兜底继续生效）；
//    destroy() 则连 class 一并移除，撤销同样干净。
// 2. 监听 matchMedia change——用户在会话中途切换系统「减少动态效果」偏好时即时创建/销毁，
//    不必刷新页面才生效。
//
// 配置（用户确认的温和默认）：lerp 0.1（官方默认，约 300~400ms 惯性，跟手不漂浮）；
// smoothWheel / syncTouch 取 1.3.26 默认值（true / false）不显式写——syncTouch 关闭即
// 移动端触摸保持原生跟手，规避官方提示的 syncTouch 手感 lag。
// stopInertiaOnNavigate: true——点击站内链接时清零滚动惯性，与 Nuxt 路由 scrollBehavior
// （滚到顶）和 app.vue 的 out-in 页面过渡不打架（源码 onClick → reset() 行为核实）。
//
// 与既有滚动机制零冲突（调研结论，均不改动）：useScrollDirection / useReadingProgress
// 监听原生 scroll 事件——Lenis 驱动真实 scrollY，照常触发；v-reveal 走 IntersectionObserver；
// 全仓无嵌套滚动容器、无 scrollTo / scrollIntoView 调用；弹层滚动锁用 body overflow。
export default defineNuxtPlugin(async () => {
  const { default: Lenis } = await import('lenis')
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  let lenis: InstanceType<typeof Lenis> | null = null
  let rafId = 0

  function destroy() {
    if (!lenis) return
    cancelAnimationFrame(rafId)
    rafId = 0
    lenis.destroy() // 连同 html 上的 lenis-* class 一并移除，回退原生滚动
    lenis = null
  }

  function create() {
    if (lenis) return
    // 双保险：html 上已有 lenis class 说明实例已存在（防插件重复执行时开出第二个实例）
    if (document.documentElement.classList.contains('lenis')) return
    lenis = new Lenis({
      lerp: 0.1,
      stopInertiaOnNavigate: true
    })
    const raf = (time: number) => {
      lenis?.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
  }

  function apply() {
    if (mq.matches) destroy()
    else create()
  }

  apply() // 初始门控：reduce 偏好下不初始化
  mq.addEventListener('change', apply) // 会话中途切换系统偏好即时生效
})
