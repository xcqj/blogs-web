<script setup lang="ts">
// 作者中心·发文/编辑表单（S12，design/author-editor.html 基线；§2.8 锁定：无 slug、无定时发布）。
// 保存 = §3.1 创建（草稿）或 §3.4 保存（内容变化才建新版本，由后端判定）；发布 = §3.5 独立动作。
// ADMIN_HIDDEN 只读（作者不可编辑/自恢复，红线由后端强制，这里只做体验）。
import type { AuthorArticleDetail, ArticleSavePayload } from '~/types/author';

const props = defineProps<{ articleId?: string }>();

const router = useRouter();
const title = ref('');
const summary = ref('');
const coverUrl = ref('');
const content = ref('');
const tagNames = ref<string[]>([]);

const detail = ref<AuthorArticleDetail | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const notice = ref('');

const isEdit = computed(() => !!props.articleId);
const readOnly = computed(() => detail.value?.visibility === '2');
const isPublished = computed(() => detail.value?.status === '1');

// 客户端校验只是体验；权威校验在后端（§3.1 约束：title/content 必填、tagNames 1~6）
const canSave = computed(
  () => !saving.value && !readOnly.value && title.value.trim() && content.value.trim() && tagNames.value.length >= 1 && tagNames.value.length <= 6
);

async function load() {
  if (!props.articleId) return;
  loading.value = true;
  error.value = '';
  try {
    const d = await $fetch<AuthorArticleDetail>(`/api/blog/article/${props.articleId}`);
    detail.value = d;
    title.value = d.currentVersion?.title ?? '';
    summary.value = d.currentVersion?.summary ?? '';
    coverUrl.value = d.currentVersion?.coverUrl ?? '';
    content.value = d.currentVersion?.content ?? '';
    tagNames.value = (d.tags ?? []).map((t) => t.name);
  } catch (e: any) {
    error.value = e?.statusMessage || '文章加载失败（可能不是你的文章）';
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(() => props.articleId, load);

function payload(): ArticleSavePayload {
  return {
    title: title.value.trim(),
    summary: summary.value.trim() || undefined,
    coverUrl: coverUrl.value.trim() || undefined,
    content: content.value,
    tagNames: tagNames.value
  };
}

async function persist(): Promise<string | null> {
  const body = payload();
  if (isEdit.value) {
    await $fetch(`/api/blog/article/${props.articleId}`, { method: 'PUT', body });
    return props.articleId!;
  }
  // §3.1 创建返回 articleId（R<Long>，序列化为字符串或数字）
  const id = await $fetch<string | number>('/api/blog/article', { method: 'POST', body });
  return String(id);
}

async function submit(publish: boolean) {
  if (!canSave.value) return;
  saving.value = true;
  error.value = '';
  notice.value = '';
  try {
    const id = await persist();
    if (publish && id) {
      await $fetch(`/api/blog/article/${id}/publish`, { method: 'POST' });
    }
    notice.value = publish ? '已保存并发布' : '已保存草稿';
    if (!isEdit.value && id) {
      // 新建成功后切到编辑路由，后续保存走 PUT 而不是重复创建
      await router.replace(`/me/${id}/edit`);
    } else {
      await load();
    }
  } catch (e: any) {
    error.value = e?.statusMessage || e?.data?.msg || '保存失败，请检查标题/正文/标签（1~6 个）';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section>
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <NuxtLink to="/me" class="sd-act no-underline">← 我的文章</NuxtLink>
        <h1 class="text-xl font-semibold">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
        <StatusBadge v-if="detail" :status="detail.status" :visibility="detail.visibility" />
      </div>
      <NuxtLink v-if="isPublished && detail" :to="`/post/${detail.articleId}`" class="text-sm text-muted hover:text-primary">
        查看前台页面 →
      </NuxtLink>
    </header>

    <p v-if="readOnly" class="mb-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
      该文章已被管理员下线，作者不可编辑或自行恢复；如需处理请联系平台管理。
    </p>
    <p v-if="notice" class="mb-3 rounded-md bg-chip px-3 py-2 text-sm text-primary-strong">{{ notice }}</p>
    <p v-if="error" class="mb-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{{ error }}</p>

    <div v-if="loading" class="sd-card p-6 text-sm text-muted">加载文章数据…</div>

    <div v-else class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <!-- 左：标题 + 正文编辑器（ClientOnly：WangEditor 是纯浏览器组件） -->
      <div class="min-w-0">
        <input v-model="title" class="title-input" maxlength="200" placeholder="输入文章标题…" :disabled="readOnly" />
        <ClientOnly>
          <ArticleEditor v-model="content" :read-only="readOnly" :min-height="420" />
          <template #fallback>
            <div class="sd-card text-sm text-muted">编辑器加载中…（富文本仅在客户端渲染，不参与 SSR）</div>
          </template>
        </ClientOnly>
      </div>

      <!-- 右：发布选项面板 -->
      <aside class="sd-card space-y-4 p-4">
        <div class="sd-field">
          <label class="sd-label">标签（1~6）</label>
          <TagChipsInput v-model="tagNames" />
        </div>

        <div class="sd-field">
          <label class="sd-label">摘要（可选，≤500 字）</label>
          <textarea v-model="summary" rows="3" maxlength="500" class="sd-textarea" placeholder="列表页展示的摘要，留空则由后端处理" :disabled="readOnly" />
        </div>

        <div class="sd-field">
          <label class="sd-label">封面（可选）</label>
          <CoverField v-model="coverUrl" />
        </div>

        <div class="flex flex-col gap-2 border-t border-border pt-3">
          <button class="btn-ghost" :disabled="!canSave" @click="submit(false)">
            {{ saving ? '保存中…' : isEdit ? '保存修改' : '保存为草稿' }}
          </button>
          <button class="btn-primary" :disabled="!canSave" @click="submit(true)">
            {{ saving ? '提交中…' : isPublished ? '保存并同步发布' : '保存并发布' }}
          </button>
          <p class="sd-hint">
            保存只在内容真正变化时产生新版本（append-only，后端判定）；已发布文章保存后立即生效，首次发布时间不变。
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
/* 标题输入（design/app.css .title-input）：无边框大号字，下划线分隔 */
.title-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: var(--text-2xl);
  font-weight: 800;
  line-height: var(--lh-2xl);
  padding: 0.375rem 0;
  margin-bottom: 1rem;
  outline: none;
}
.title-input:focus {
  border-bottom-color: var(--accent);
}
</style>
