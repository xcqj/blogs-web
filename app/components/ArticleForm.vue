<script setup lang="ts">
// 作者中心·发文/编辑表单（S12；2026-10-08 起改为「渐进披露」形态，对照掘金写作页）。
// 主区只有 标题 / 标签 / 正文；摘要与封面（可选字段）+ 首次发布时间 + 历史版本收进「更多」抽屉。
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
// 保存/发布结果走全站 toast（L3），不再占用页内横幅位置
const toast = useToast();
const drawerOpen = ref(false);

const isEdit = computed(() => !!props.articleId);
const readOnly = computed(() => detail.value?.visibility === '2');
const isPublished = computed(() => detail.value?.status === '1');

// 与顶栏滚动隐藏联动（M11 修复，S17 移动视口回归发现）：窄屏顶栏下滑隐藏时，
// 本操作条的 top 从 4rem 收回 0 贴住视顶（功能性元素不能随顶栏一起消失，
// 也不留空隙）；桌面不受影响（CSS 媒体查询限制，同 .site-header 口径）。
const { hideHeader } = useScrollDirection();

// 客户端校验只是体验；权威校验在后端（§3.1 约束：title/content 必填、tagNames 1~6）。
// 不再用 canSave 去 disabled 按钮——禁用态点击零反馈，改为 submit() 里校验并告知缺哪项。

/** 与最近一次加载/保存的内容快照比较，用于顶栏的「未保存/已保存」提示（不做自动保存，避免误写库） */
function snapshot() {
  return JSON.stringify({
    title: title.value,
    summary: summary.value,
    coverUrl: coverUrl.value,
    content: content.value,
    tagNames: tagNames.value
  });
}
const baseline = ref('');
const savedAt = ref('');
const dirty = computed(() => baseline.value !== '' && snapshot() !== baseline.value);
const saveStateText = computed(() => {
  if (loading.value) return '';
  if (!baseline.value) return '';
  if (dirty.value) return '有未保存更改';
  return savedAt.value ? `已保存 · ${savedAt.value}` : '尚未保存';
});
function markSaved() {
  baseline.value = snapshot();
  savedAt.value = new Date().toTimeString().slice(0, 5);
}

async function load() {
  if (!props.articleId) {
    baseline.value = snapshot();
    return;
  }
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
    baseline.value = snapshot();
  } catch (e: any) {
    error.value = apiErrorText(e, '文章加载失败（可能不是你的文章）');
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
    // 未手动选封面时自动取正文首图（A 方案，零后端）；手动选图仍以手动值为准
    coverUrl: coverUrl.value.trim() || pickFirstImage(content.value) || undefined,
    // 代码块换行规范化（S24/T26-a）：WangEditor 的 getHtml 用 <br> 表示代码块内换行，
    // 而它的 setHtml 不认 <br>（实测 a<br>b → ab），不转换的话「打开编辑页→保存」会把多行代码压平
    content: normalizeCodeNewlines(content.value),
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

/** 缺哪些必填项（按主区顺序），用于点击保存/发布时给出具体指引 */
function missingFields(): string[] {
  const missing: string[] = []
  if (!title.value.trim()) missing.push('标题')
  if (tagNames.value.length === 0) missing.push('标签')
  if (!content.value.trim()) missing.push('正文')
  return missing
}

async function submit(publish: boolean) {
  if (saving.value || readOnly.value) return;
  // 按钮不再 disabled：禁用态点击毫无反馈，用户不知道缺什么（2026-10-27 用户实测反馈）。
  // 改为可点 + 明确告知缺哪一项，并同步写进操作条下方的错误行。
  const missing = missingFields()
  if (missing.length) {
    const action = publish ? '发布' : '存为草稿'
    const msg = `请先填写${missing.join('、')}，再${action}`
    error.value = msg
    toast.err(`暂时无法${action}`, msg, { key: 'article-save' })
    return
  }
  if (tagNames.value.length > 6) {
    const msg = '标签最多 6 个，请先删减'
    error.value = msg
    toast.err('暂时无法保存', msg, { key: 'article-save' })
    return
  }
  saving.value = true;
  error.value = '';
  try {
    const id = await persist();
    if (publish && id) {
      await $fetch(`/api/blog/article/${id}/publish`, { method: 'POST' });
    }
    markSaved();
    toast.ok(
      publish ? '已发布' : '已保存草稿',
      publish ? '读者已可在列表与搜索中看到它' : '仅你自己可见，可继续编辑',
      { key: 'article-save', action: isEdit.value ? undefined : { label: '去编辑', to: `/me/${id}/edit` } }
    );
    if (publish) {
      // 发布成功后直接返回文章列表（新建/编辑一致）
      await router.replace('/me');
    } else if (!isEdit.value && id) {
      // 新建草稿后切到编辑路由，后续保存走 PUT 而不是重复创建
      await router.replace(`/me/${id}/edit`);
    } else {
      await load();
    }
  } catch (e: any) {
    error.value = apiErrorText(e, '保存失败，请检查标题/正文/标签（1~6 个）');
    toast.err('保存失败', error.value, { key: 'article-save' });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section>
    <!-- 操作条：贴在顶栏（h-16）下方，写作时始终可保存/发布 -->
    <!-- 操作条（方向 C）：贴在 AppHeader（64px）下方，只留 1px 底线——不再做成面板/圆角，
         与全站"细线分层"语言一致；窄屏顶栏下滑隐藏时 top 收回 0（.sd-sticky-top 负责） -->
    <div
      class="sd-sticky-top sticky top-16 z-20 mb-6 flex flex-wrap items-center gap-3 border-b border-border bg-bg py-2"
      :class="{ 'is-header-hidden': hideHeader }"
    >
      <NuxtLink to="/me" class="sd-act no-underline">← 我的文章</NuxtLink>
      <h1 class="text-base font-semibold">{{ isEdit ? '编辑文章' : '新建文章' }}</h1>
      <StatusBadge v-if="detail" :status="detail.status" :visibility="detail.visibility" />
      <NuxtLink
        v-if="isPublished && detail"
        :to="`/post/${detail.articleId}`"
        class="text-xs text-muted transition hover:text-primary"
      >
        查看前台 →
      </NuxtLink>

      <span class="ml-auto text-xs text-muted">{{ saveStateText }}</span>
      <!-- 桌面右栏已常驻设置项，抽屉只在 <1024 需要 -->
      <button class="sd-act lg:hidden" @click="drawerOpen = true">更多</button>
      <!-- 已发布文章不再提供「发布」：后端 ArticleGuards.requirePublishable 只允许草稿发布，
           重复调用会抛「仅草稿状态的文章可以发布」；隐藏/下线文章的重新公开仍在 /me 列表行做 -->
      <!-- 只在提交中禁用：字段缺失时保持可点，由 submit() 告知缺哪项 -->
      <SdButton v-if="isPublished" :disabled="saving" @click="submit(false)">
        {{ saving ? '保存中…' : '保存修改' }}
      </SdButton>
      <template v-else>
        <SdButton variant="ghost" :disabled="saving" @click="submit(false)">
          {{ saving ? '保存中…' : '存为草稿' }}
        </SdButton>
        <SdButton :disabled="saving" @click="submit(true)">
          {{ saving ? '提交中…' : '发布' }}
        </SdButton>
      </template>
    </div>

    <p v-if="readOnly" class="mb-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
      该文章已被管理员下线，作者不可编辑或自行恢复；如需处理请联系平台管理。
    </p>
    <p v-if="error" class="mb-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{{ error }}</p>

    <div v-if="loading" class="sd-card p-6 text-sm text-muted">加载文章数据…</div>

    <!-- 主区（方向 C）：桌面两栏——左写作 / 右设置常驻（≥1024）。
         <1024 右栏收起，设置项仍走「更多」抽屉；两处共用 ArticleSettingsPanel，标记不会漂移。 -->
    <div v-else class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="min-w-0">
        <input v-model="title" class="title-input" maxlength="200" placeholder="输入文章标题…" :disabled="readOnly" />

        <div class="mb-5">
          <label class="mb-1.5 block font-mono text-xs uppercase tracking-[0.08em] text-dim">
            标签（1~6，必填）
          </label>
          <TagChipsInput v-model="tagNames" />
        </div>

        <!-- ClientOnly：WangEditor 是纯浏览器组件；本页路由已 ssr:false，这层是防复用到 SSR 页的保险 -->
        <ClientOnly>
          <ArticleEditor v-model="content" :read-only="readOnly" :min-height="480" />
          <template #fallback>
            <div class="border border-border p-6 text-sm text-muted">
              编辑器加载中…（富文本仅在客户端渲染，不参与 SSR）
            </div>
          </template>
        </ClientOnly>
      </div>

      <!-- 桌面右栏：吸顶在「AppHeader 64 + 操作条 56」之下（132px）；窄屏隐藏 -->
      <aside class="hidden lg:sticky lg:top-[132px] lg:block lg:self-start">
        <ArticleSettingsPanel
          v-model:summary="summary"
          v-model:cover-url="coverUrl"
          :content="content"
          :read-only="readOnly"
        >
          <div class="border-t border-border pt-6">
            <p class="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-dim">发布信息</p>
            <p v-if="detail?.publishedAt" class="sd-hint">首次发布于 {{ detail.publishedAt }}</p>
            <p v-else class="sd-hint">尚未发布</p>
            <VersionHistory
              v-if="articleId && detail"
              :article-id="detail.articleId"
              :current-version-no="detail.currentVersion?.versionNo"
            />
          </div>
        </ArticleSettingsPanel>
      </aside>
    </div>

    <!-- 更多设置抽屉：摘要 / 封面 / 首次发布时间 / 历史版本（状态不在此重复，操作条已有） -->
    <PublishDrawer
      v-model:summary="summary"
      v-model:cover-url="coverUrl"
      :open="drawerOpen"
      :content="content"
      :read-only="readOnly"
      @close="drawerOpen = false"
    >
      <!-- 状态不在此重复（操作条已带徽标）；只保留抽屉里独有的首次发布时间 -->
      <p v-if="detail?.publishedAt" class="sd-hint">首次发布于 {{ detail.publishedAt }}</p>

      <!-- 历史版本只读（§4.1/§4.2；append-only，不提供恢复） -->
      <VersionHistory
        v-if="articleId && detail"
        :article-id="detail.articleId"
        :current-version-no="detail.currentVersion?.versionNo"
      />
    </PublishDrawer>
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
  /* 方向 C：文章标题是 H1 级，走衬线（与详情页 h1 同一套语言），负字距收紧 */
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: 700;
  line-height: var(--lh-2xl);
  letter-spacing: var(--ls-h1);
  padding: 0.375rem 0;
  margin-bottom: 1rem;
  outline: none;
}
.title-input:focus {
  border-bottom-color: var(--accent);
}
/* 三轮精修（用户截图反馈「标题不太明显」）：.title-input 是裸 input（无 sd-input 类），
   placeholder 吃 UA 默认半透明继承色，32px 大字号下呈淡灰——显式指定 --text-muted
   （dim 为备选；深浅双主题经 token 自动适配，6.88:1/7.89:1 过 AA） */
.title-input::placeholder {
  color: var(--text-muted);
}
</style>
