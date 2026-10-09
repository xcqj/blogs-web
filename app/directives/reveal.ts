// v-reveal：元素进入视口时淡入上移（质感打磨轮 批2 · M4）。
// 由 Nuxt 从 app/directives/ 自动注册，模板里写 `v-reveal` 即可（文件名即指令名）。
//
// 两条刻意的设计：
// 1. 隐藏态 class 由 JS 在 mounted 里加，不写在 CSS 默认值上 —— 这样禁用 JS 或
//    脚本加载失败时内容是**可见**的，不会出现"整页空白"。
// 2. 不支持 IntersectionObserver 的浏览器直接放行（不隐藏），不做 polyfill。
import type { ObjectDirective } from 'vue';

let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-revealed');
          observer?.unobserve(entry.target); // 一次性：不做反向动画，滚动来回时不重复闪
        }
      },
      // 底部留 10% 余量：元素刚露头就开始，避免"要滚到位才出现"的迟钝感
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );
  }
  return observer;
}

export default <ObjectDirective<HTMLElement, number>>{
  mounted(el: HTMLElement, binding) {
    if (typeof IntersectionObserver === 'undefined') return;
    el.classList.add('sd-reveal');
    // v-reveal="120" 传延迟毫秒，用于逐项错峰进场（单位 ms）
    if (binding.value) el.style.transitionDelay = `${binding.value}ms`;
    getObserver().observe(el);
  },
  unmounted(el: HTMLElement) {
    observer?.unobserve(el);
  }
};
