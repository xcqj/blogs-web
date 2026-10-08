<script setup lang="ts">
// /me —— 作者中心·我的文章（S12 / D29，design/author-articles.html 基线）。
// 全部走 /api/blog/article/**（Nitro 注入 cookie token + clientid）→ 后端 /blog/article/my 等，
// 归属与权限由后端按 author_id 强制校验；前端不传 authorId（红线）。
import type { AuthorArticle } from '~/types/author'
import type { PageResult } from '~/types/blog'

const { logged, ready } = useRequireAuth()

const route = useRoute()
const router = useRouter()
const pageSize = 10
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const tab = computed(() => {
  const t = String(route.query.tab || 'all')
  return TABS.some((x) => x.key === t) ? t : 'all'
})

/** tab → 后端过滤参数（status/visibility 语义见契约 §3；已隐藏与管理员下线分开，因后端一次只能过滤一个 visibility） */
const TABS = [
  { key: 'all', label: '全部', q: {} },
  { key: 'draft', label: '草稿', q: { status: '0' } },
  { key: 'published', label: '已发布', q: { status: '1', visibility: '0' } },
  { key: 'hidden', label: '我隐藏的', q: { visibility: '1' } },
  { key: 'offline', label: '已下线', q: { visibility: '2' } }
] as const

function filterOf(key: string): Record<string, string> {
  return (TABS.find((t) => t.key === key)?.q ?? {}) as Record<string, string>
}

const empty = () => ({ rows: [], total: 0 }) as PageResult<AuthorArticle>

const { data: list, status: listStatus, refresh: refreshList } = await useAsyncData(
  `me-articles-${tab.value}-${page.value}`,
  () =>
    logged.value
      ? $fetch<PageResult<AuthorArticle>>('/api/blog/article/my', {
          query: { pageNum: page.value, pageSize, ...filterOf(tab.value) }
        })
      : Promise.resolve(empty()),
  { watch: [tab, page, logged] }
)

// 各 tab 计数：pageSize=1 只取 total，一次并发拉齐（动作后随列表一起刷新）
const { data: counts, refresh: refreshCounts } = await useAsyncData(
  'me-tab-counts',
  () =>
    logged.value
      ? Promise.all(
          TABS.map((t) =>
            $fetch<PageResult<AuthorArticle>>('/api/blog/article/my', {
              query: { pageNum: 1, pageSize: 1, ...filterOf(t.key) }
            }).then((r) => [t.key, r.total] as const)
          )
        ).then(Object.fromEntries)
      : Promise.resolve({} as Record<string, number>),
  { watch: [logged] }
)

function go(next: string, pageNo = 1) {
  router.replace({ path: '/me', query: { ...(next === 'all' ? {} : { tab: next }), ...(pageNo > 1 ? { page: pageNo } : {}) } })
}

const busy = ref(false)
// 反馈体系（L3）：动作结果走 toast，不可逆的删除走阻断式确认框
const toast = useToast()
const ask = useConfirm()

/** 动作的人话标签，用于 toast 标题 */
const ACTION_LABEL = { publish: '发布', hide: '隐藏', show: '重新公开', delete: '删除' } as const

async function action(kind: 'publish' | 'hide' | 'show' | 'delete', a: AuthorArticle) {
  if (busy.value) return
  if (kind === 'delete') {
    const ok = await ask({
      title: '删除这篇文章？',
      body: '删除后文章与其全部历史版本将不再展示（逻辑删除，平台管理员可从后台恢复）。',
      target: `《${a.title}》 · 最后更新 ${(a.updateTime || a.publishedAt || '').slice(0, 10) || '未知'}`,
      confirmText: '确认删除',
      danger: true
    })
    if (!ok) return
  }
  busy.value = true
  try {
    if (kind === 'delete') {
      await $fetch(`/api/blog/article/${a.articleId}`, { method: 'DELETE' })
    } else {
      await $fetch(`/api/blog/article/${a.articleId}/${kind}`, { method: 'POST' })
    }
    toast.ok(`${ACTION_LABEL[kind]}成功`, `《${a.title}》已更新`, { key: 'article-action' })
    await Promise.all([refreshList(), refreshCounts()])
  } catch (e: any) {
    // 越权/状态不允许由后端判定，前端只如实转达（错误类不自动消失）
    toast.err(`${ACTION_LABEL[kind]}失败`, apiErrorText(e, '操作失败，请稍后重试'), { key: 'article-action' })
  } finally {
    busy.value = false
  }
}

const editTarget = (id?: string) => (id ? `/me/${id}/edit` : '/me/new')

useSeoMeta({ title: '我的文章 · 作者中心', robots: 'noindex,follow' })
</script>

<template>
  <section>
    <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-[var(--ls-h2)]">我的文章</h1>
        <p class="mt-1 text-sm text-muted">作者中心 · 服务端按 author_id 隔离，仅显示你自己的文章</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink to="/me/profile" class="btn-ghost">个人资料</NuxtLink>
        <NuxtLink :to="editTarget()" class="btn-primary">＋ 新建文章</NuxtLink>
      </div>
    </header>

    <!-- 未登录：守卫已唤起登录弹层，这里给占位说明，不发无谓请求 -->
    <ErrorState v-if="ready && !logged" title="请先登录" description="作者中心需要登录后访问，登录框已为你打开。">
      <NuxtLink to="/" class="btn-ghost">返回首页</NuxtLink>
    </ErrorState>

    <template v-else>
      <nav class="-mt-2 mb-4 flex flex-wrap gap-1.5 border-b border-border">
        <button
          v-for="t in TABS"
          :key="t.key"
          :class="tab === t.key ? 'sd-tab-on' : 'sd-tab'"
          @click="go(t.key)"
        >
          {{ t.label }}<span class="ml-1 text-xs text-muted">{{ counts?.[t.key] ?? '·' }}</span>
        </button>
      </nav>


      <ArticleListSkeleton v-if="listStatus === 'pending'" :count="4" />
      <template v-else>
        <div class="space-y-3">
          <AuthorArticleRow
            v-for="a in list?.rows"
            :key="a.articleId"
            :article="a"
            :busy="busy"
            @edit="router.push(editTarget(a.articleId))"
            @publish="action('publish', a)"
            @hide="action('hide', a)"
            @show="action('show', a)"
            @delete="action('delete', a)"
          />
        </div>
        <EmptyState
          v-if="!list?.rows?.length"
          :title="logged ? '这里还没有文章' : '未登录'"
          description="新建一篇文章开始写作；草稿不会出现在读者前台。"
        >
          <NuxtLink to="/me/new" class="btn-primary mt-1">写第一篇</NuxtLink>
        </EmptyState>
        <AppPagination
          :page="page"
          :total="list?.total ?? 0"
          :page-size="pageSize"
          :link-for="(n) => ({ path: '/me', query: { ...(tab === 'all' ? {} : { tab }), ...(n > 1 ? { page: n } : {}) } })"
        />
      </template>
    </template>
  </section>
</template>
