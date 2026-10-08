<script setup lang="ts">
// 发布设置抽屉（S12-ui 渐进披露）：写作主区只留「标题 / 标签 / 正文」，
// 摘要与封面（两个可选字段）连同状态、历史版本收进这里，需要时再滑出，减少一次性摊开的信息量。
// 注：标签不收进抽屉——后端 createDraft/update 都会跑 validateTagCount（1~6），草稿也必须带标签。
import { pickFirstImage } from '~/utils/firstImage';

const props = defineProps<{ open: boolean; content: string; readOnly?: boolean }>();
const emit = defineEmits<{ close: [] }>();

const summary = defineModel<string>('summary', { required: true });
const coverUrl = defineModel<string>('coverUrl', { required: true });

/** 未手动选图时将要自动采用的正文首图（与 ArticleForm 实际保存逻辑同源） */
const autoCover = computed(() => (coverUrl.value.trim() ? null : pickFirstImage(props.content)));

function adoptAutoCover() {
  if (autoCover.value) coverUrl.value = autoCover.value;
}

/** 从正文纯文本前 80 字生成摘要草稿（生成后作者仍可手改） */
function fillSummaryFromContent() {
  const text = new DOMParser()
    .parseFromString(props.content || '', 'text/html')
    .body?.textContent?.replace(/\s+/g, ' ')
    .trim() ?? '';
  summary.value = text.slice(0, 80);
}

// 交互补强（2026-10-08 复验发现缺失）：ESC 关闭 + 开启时锁背景滚动。
// 监听只在 onMounted/onUnmounted 注册，不在服务端路径触 DOM。
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}
function lockBodyScroll(open: boolean) {
  document.body.style.overflow = open ? 'hidden' : '';
}
watch(() => props.open, lockBodyScroll);
onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  if (props.open) lockBodyScroll(true);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  if (props.open) lockBodyScroll(false);
});
</script>

<template>
  <Transition name="sd-drawer">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/45" @click="emit('close')" />
      <aside class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-elevated shadow-md">
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 class="text-base font-semibold">发布设置</h2>
          <button class="sd-act" @click="emit('close')">关闭 ✕</button>
        </header>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div class="sd-field">
            <div class="mb-1.5 flex items-center justify-between gap-2">
              <label class="text-sm font-semibold text-muted">摘要（可选，≤500 字）</label>
              <button
                class="shrink-0 text-xs text-primary hover:underline"
                :disabled="readOnly || !content"
                @click="fillSummaryFromContent"
              >
                从正文生成
              </button>
            </div>
            <textarea
              v-model="summary"
              rows="4"
              maxlength="500"
              class="sd-textarea"
              :disabled="readOnly"
              placeholder="列表页展示的摘要，留空则不写"
            />
            <p class="sd-hint">{{ summary.length }}/500</p>
          </div>

          <div class="sd-field">
            <label class="sd-label">封面（可选）</label>
            <CoverField v-model="coverUrl" :disabled="readOnly" />
            <!-- 自动封面提示：未手动选图时保存会自动取正文首图 -->
            <div v-if="autoCover" class="mt-2 flex items-center gap-2.5 rounded-md border border-border bg-surface p-2.5">
              <img :src="autoCover" alt="正文首图" class="h-12 w-16 shrink-0 rounded object-cover" />
              <div class="min-w-0 flex-1">
                <p class="text-xs">未设置封面，保存时将自动取正文首图</p>
                <button class="mt-0.5 text-xs text-primary hover:underline" :disabled="readOnly" @click="adoptAutoCover">
                  立即采用为封面
                </button>
              </div>
            </div>
          </div>

          <!-- 额外区块（状态徽标、历史版本等由调用方注入） -->
          <slot />
        </div>

        <footer class="shrink-0 border-t border-border px-5 py-3">
          <p class="sd-hint">
            保存只在内容真正变化时产生新版本（append-only，后端判定）；已发布文章保存后立即生效，首次发布时间不变。
          </p>
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
/* 抽屉滑入滑出（主区不动，避免写作时布局跳动） */
.sd-drawer-enter-active,
.sd-drawer-leave-active {
  transition: opacity 0.18s ease;
}
.sd-drawer-enter-active aside,
.sd-drawer-leave-active aside {
  transition: transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.sd-drawer-enter-from,
.sd-drawer-leave-to {
  opacity: 0;
}
.sd-drawer-enter-from aside,
.sd-drawer-leave-to aside {
  transform: translateX(100%);
}
</style>
