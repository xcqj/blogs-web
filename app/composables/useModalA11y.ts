// 弹层可访问性基建（质感打磨轮 L3）：ESC 关闭、背景滚动锁、焦点圈定与关闭后焦点归还。
// 登录弹层 / 发布设置抽屉 / 确认框共用同一实现，避免各处各写一套且各缺一样。
//
// SSR 安全：所有 DOM 访问都发生在 onMounted 之后或客户端事件回调内；
// watch 用 getter 形式，服务端渲染阶段不会触 document。
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue';

/** 可聚焦元素（含可滚动容器与 shadow 内常见交互件），顺序即 Tab 顺序 */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export interface ModalA11yOptions {
  /** 是否打开（用 getter 传响应式值） */
  isOpen: () => boolean;
  /** 弹层根元素，用于圈定焦点 */
  container: () => HTMLElement | null | undefined;
  /** 关闭回调（ESC 或 Tab 越界不触发，仅 ESC 与遮罩点击） */
  onClose: () => void;
}

export function useModalA11y({ isOpen, container, onClose }: ModalA11yOptions) {
  /** 打开前的焦点元素，关闭后归还 */
  let opener: HTMLElement | null = null;

  function lockScroll(locked: boolean) {
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  function onKeydown(e: KeyboardEvent) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const root = container();
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    // 焦点圈定在弹层内循环，不让 Tab 跑到被遮住的背页去
    if (e.shiftKey && (active === first || !root.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !root.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  watch(
    isOpen,
    (open) => {
      if (import.meta.server) return;
      lockScroll(open);
      if (open) {
        opener = document.activeElement as HTMLElement | null;
        nextTick(() => {
          const root = container();
          const target = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>(FOCUSABLE);
          target?.focus();
        });
      } else {
        opener?.focus?.();
        opener = null;
      }
    },
    { flush: 'post' }
  );

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown);
    // 组件在打开状态下被卸载时，必须解锁滚动，否则页面永远滚不动
    if (isOpen()) lockScroll(false);
  });
}
