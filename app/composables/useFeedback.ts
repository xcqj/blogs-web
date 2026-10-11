// 反馈体系（质感打磨轮 L3）：按「打断程度」分层的两件基建。
//   - useToast()：轻告知，自动消失、可带一个 action、同 key 去重、堆叠有上限；错误类不自动消失。
//   - useConfirm()：阻断式确认，返回 Promise<boolean>，只用于不可逆/破坏性操作。
// 选型口诀：可逆 → 直接做 + toast 带撤销；不可逆 → confirm；字段错 → inline；系统状态 → banner。
//
// ⚠️ 下面的 ref 是**模块级单例**，只在客户端事件回调里变更（SSR 期间恒为空），
//    因此不存在跨请求状态污染；组件侧统一通过 useFeedbackState() 读取。
import { ref } from 'vue';

export type ToastKind = 'ok' | 'err' | 'info';

export interface ToastAction {
  /** 按钮文案，如「撤销」「查看」 */
  label: string;
  /** 跳转路径（与 run 二选一） */
  to?: string;
  /** 点击回调 */
  run?: () => void;
}

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
  /** 去重键：同 key 的连续调用会合并成一条并刷新文案 */
  key: string;
  action?: ToastAction;
  /** 正在离场（组件据此播退出动画后再移除） */
  leaving?: boolean;
}

export interface ToastOptions {
  key?: string;
  action?: ToastAction;
  /** 自动消失时长；kind='err' 时忽略（失败信息必须被看见） */
  duration?: number;
}

export interface ConfirmOptions {
  title: string;
  /** 说明「会发生什么」，不要只问「确定吗」 */
  body?: string;
  /** 操作对象，让用户确认的是具体那一条 */
  target?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

/** 同时最多显示几条，超出挤掉最旧的 */
const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3600;

const toasts = ref<ToastItem[]>([]);
const pending = ref<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
let seq = 0;

/** 组件读取用的共享状态（不要在页面里直接 import 模块变量，走这个口子便于以后替换实现） */
export function useFeedbackState() {
  return { toasts, pending };
}

export function useToast() {
  function dismiss(id: number) {
    const item = toasts.value.find((t) => t.id === id);
    if (!item || item.leaving) return;
    item.leaving = true;
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 220);
  }

  function push(kind: ToastKind, title: string, desc?: string, opt: ToastOptions = {}) {
    const key = opt.key ?? title;
    const hit = toasts.value.find((t) => t.key === key);
    if (hit) {
      // 同 key 合并：就地更新并提到末尾，避免重复保存堆成一列
      hit.kind = kind;
      hit.title = title;
      hit.desc = desc;
      hit.action = opt.action;
      hit.leaving = false;
      toasts.value = [...toasts.value.filter((t) => t !== hit), hit];
      return;
    }
    const item: ToastItem = { id: ++seq, kind, title, desc, key, action: opt.action };
    toasts.value = [...toasts.value, item].slice(-MAX_TOASTS);
    if (kind !== 'err') setTimeout(() => dismiss(item.id), opt.duration ?? DEFAULT_DURATION);
  }

  return {
    ok: (title: string, desc?: string, opt?: ToastOptions) => push('ok', title, desc, opt),
    err: (title: string, desc?: string, opt?: ToastOptions) => push('err', title, desc, opt),
    info: (title: string, desc?: string, opt?: ToastOptions) => push('info', title, desc, opt),
    dismiss
  };
}

/**
 * 阻断式确认。用法：
 *   if (await confirm({ title: '删除这篇文章？', target: '《31231》 · 草稿', danger: true })) { ... }
 * 同一时刻只允许一个确认框（后到的排队会丢掉，避免叠加语义不清）。
 */
export function useConfirm() {
  return (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      if (pending.value) {
        pending.value.resolve(false);
      }
      pending.value = { options, resolve };
    });
}

/** 供 AppConfirmDialog 回收结果 */
export function settleConfirm(value: boolean) {
  const current = pending.value;
  if (!current) return;
  current.resolve(value);
  pending.value = null;
}
