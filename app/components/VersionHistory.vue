<script setup lang="ts">
// 历史版本只读子视图（§4.1 列表 + §4.2 快照；S12 可选项）。
// 红线：version 表 append-only，MVP 不提供「从历史版本恢复」，故这里只有查看、无恢复按钮。
import type { ArticleVersionMeta } from '~/types/author';
import type { ArticleVersion as VersionSnapshot } from '~/types/blog';

const props = defineProps<{ articleId: string; currentVersionNo?: number }>();

const expanded = ref(false);
const list = ref<ArticleVersionMeta[]>([]);
const loading = ref(false);
const error = ref('');

const snapshot = ref<VersionSnapshot | null>(null);
const snapLoading = ref(false);

async function load() {
  if (!props.articleId) return;
  loading.value = true;
  error.value = '';
  try {
    list.value = await $fetch<ArticleVersionMeta[]>(`/api/blog/article/${props.articleId}/versions`);
  } catch (e: any) {
    error.value = apiErrorText(e, '版本列表加载失败');
  } finally {
    loading.value = false;
  }
}

async function toggle() {
  expanded.value = !expanded.value;
  if (expanded.value && !list.value.length) await load();
}

async function view(v: ArticleVersionMeta) {
  snapLoading.value = true;
  try {
    snapshot.value = await $fetch<VersionSnapshot>(`/api/blog/article/${props.articleId}/versions/${v.versionId}`);
  } catch (e: any) {
    error.value = apiErrorText(e, '版本快照加载失败');
  } finally {
    snapLoading.value = false;
  }
}

function close() {
  snapshot.value = null;
}
</script>

<template>
  <div class="sd-card mt-4">
    <button class="flex w-full items-center justify-between px-4 py-3 text-left" :aria-expanded="expanded" @click="toggle">
      <span class="text-sm font-semibold">
        历史版本<span v-if="list.length" class="ml-1 text-muted">({{ list.length }})</span>
      </span>
      <span :class="expanded ? 'i-mdi:chevron-up' : 'i-mdi:chevron-down'" aria-hidden="true" />
    </button>

    <div v-if="expanded" class="border-t border-border px-4 py-3">
      <p v-if="loading" class="text-sm text-muted">加载中…</p>
      <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>
      <p v-else-if="!list.length" class="text-sm text-muted">暂无版本记录</p>
      <ul v-else class="divide-y divide-border">
        <li v-for="v in list" :key="v.versionId" class="flex items-center justify-between gap-3 py-2">
          <div class="min-w-0">
            <p class="truncate text-sm">
              <span class="font-semibold">v{{ v.versionNo }}</span>
              <span v-if="v.versionNo === currentVersionNo" class="sd-badge ml-2 bg-soft text-primary-fg">当前</span>
              <span class="ml-2 text-muted">{{ v.title }}</span>
            </p>
            <p class="sd-hint">{{ v.createTime }}</p>
          </div>
          <button class="sd-act shrink-0" :disabled="snapLoading" @click="view(v)">查看</button>
        </li>
      </ul>
      <p class="sd-hint mt-2">版本为只读快照（append-only），MVP 不提供恢复到历史版本。</p>
    </div>

    <!-- 快照查看层 -->
    <div v-if="snapshot" class="fixed inset-0 z-50 flex items-start justify-center bg-[var(--scrim)] p-4 backdrop-blur-[6px] sm:p-8" @click.self="close">
      <div class="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-elevated">
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">v{{ snapshot.versionNo }} · {{ snapshot.title }}</p>
            <p class="sd-hint">{{ snapshot.createTime }}</p>
          </div>
          <button class="sd-act shrink-0" @click="close">关闭 ✕</button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto p-4">
          <p v-if="snapshot.summary" class="mb-4 border-l-2 border-border pl-3 text-sm text-muted">{{ snapshot.summary }}</p>
          <!-- 快照内容入库前已由后端 jsoup 净化，前台不再二次清洗 -->
          <div class="prose max-w-none" v-html="snapshot.content" />
        </div>
      </div>
    </div>
  </div>
</template>
