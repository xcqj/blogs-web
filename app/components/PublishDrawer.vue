<script setup lang="ts">
// 更多设置抽屉（S12-ui 渐进披露）：写作主区只留「标题 / 标签 / 正文」，
// 摘要与封面（两个可选字段）连同历史版本收进这里，需要时再滑出，减少一次性摊开的信息量。
// 注：标签不收进抽屉——后端 createDraft/update 都会跑 validateTagCount（1~6），草稿也必须带标签。
// 摘要/封面/自动封面等逻辑已下沉到 ArticleSettingsPanel（桌面右栏与抽屉共用），
// 本组件只负责「抽屉外壳」：遮罩、滑入动画、a11y、关闭。
const props = defineProps<{ open: boolean; content: string; readOnly?: boolean }>();
const emit = defineEmits<{ close: [] }>();

const summary = defineModel<string>('summary', { required: true });
const coverUrl = defineModel<string>('coverUrl', { required: true });

// 交互统一走 useModalA11y（L3）：ESC 关闭 + 背景滚动锁 + 焦点圈定与归还，
// 与登录弹层/确认框共用同一实现（之前两处各写一套且都缺 focus trap）。
const panelEl = ref<HTMLElement>();
useModalA11y({ isOpen: () => props.open, container: () => panelEl.value, onClose: () => emit('close') });
</script>

<template>
  <Transition name="sd-drawer">
    <div v-if="open" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-[var(--scrim)] backdrop-blur-[6px]" @click="emit('close')" />
      <aside
        ref="panelEl"
        class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-elevated shadow-[var(--shadow-float)]"
      >
        <header class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 class="text-base font-semibold">更多设置</h2>
          <button class="sd-act" @click="emit('close')">关闭 ✕</button>
        </header>

        <!-- 内容与「桌面右栏常驻」共用 ArticleSettingsPanel，避免两处标记各自演化 -->
        <div class="min-h-0 flex-1 overflow-y-auto p-5">
          <ArticleSettingsPanel v-model:summary="summary" v-model:cover-url="coverUrl" :content="content" :read-only="readOnly">
            <!-- 额外区块（发布信息、历史版本等由调用方注入） -->
            <slot />
          </ArticleSettingsPanel>
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
