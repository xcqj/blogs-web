// 滚动相关的两个 composable（质感打磨轮 · 批2）。
// SSR 安全：监听只在 onMounted 注册、onBeforeUnmount 摘除；服务端返回值用初始安全值。
import { onBeforeUnmount, onMounted, ref } from 'vue';

/** 超过该像素的下滑才收起顶栏，避免轻微抖动就隐藏 */
const THRESHOLD = 12;

/**
 * 滚动方向感知（M11）：下滑隐藏顶栏、上滑立即出现。
 * 实际隐藏效果由 CSS 限制在 <768（见 transitions.css），桌面始终保留顶栏，
 * 因为作者中心吸顶操作条用 top-16 定位，桌面隐藏顶栏会在其上方留出一条空隙。
 */
export function useScrollDirection() {
  const hideHeader = ref(false);
  const atTop = ref(true);

  if (import.meta.client) {
    let last = 0;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      atTop.value = y < 8;
      if (Math.abs(y - last) >= THRESHOLD) {
        // 触底时不隐藏，否则分页/最后一段永远顶不到导航
        const bottom = y + window.innerHeight >= document.documentElement.scrollHeight - 80;
        hideHeader.value = y > last && !bottom;
        last = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      // 用 rAF 节流：滚动事件频率远高于帧率，不节流会掉帧
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    onMounted(() => {
      last = window.scrollY;
      window.addEventListener('scroll', onScroll, { passive: true });
    });
    onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
  }

  return { hideHeader, atTop };
}

/**
 * 阅读进度（M10）：0~1，用于详情页顶部进度条。
 * 只读两个布局度量并按 rAF 节流；transform: scaleX 不动 width，避免触发重排。
 */
export function useReadingProgress() {
  const progress = ref(0);

  if (import.meta.client) {
    let ticking = false;

    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      progress.value = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    onMounted(() => {
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    });
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    });
  }

  return { progress };
}
