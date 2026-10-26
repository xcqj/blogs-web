<script setup lang="ts">
// /user/{userId} —— §9.1 公开资料 + 其公开文章（§5.1 authorId 过滤，等价 §9.2）。
// 方向 C（S23-T19）：资料区去面板边框（编号小字 + 底线 + 衬线昵称），文章列表换 PostRow
// 并取消按月归档分组——与首页/标签/翻页四页形态统一。
import type { ArticleSummary, PageResult, PublicUser } from '~/types/blog'

const route = useRoute()
const userId = computed(() => String(route.params.userId || ''))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const pageSize = 10

const { data: user, error: userError } = await useAsyncData(
  `user-${userId.value}`,
  () => $fetch<PublicUser>(`/api/blog/public/users/${userId.value}`),
  { watch: [userId] }
)
const { data: articles, status } = await useAsyncData(
  `user-articles-${userId.value}-${page.value}`,
  () =>
    $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', {
      query: { authorId: userId.value, pageNum: page.value, pageSize }
    }),
  { watch: [userId, page] }
)

const rows = computed(() => articles.value?.rows ?? [])

useSeoMeta({
  title: () => (user.value ? `${user.value.nickName} · 作者主页` : '用户主页'),
  description: () => (user.value ? `${user.value.nickName} 的公开文章与简介。` : '用户主页。'),
  ogTitle: () => (user.value?.nickName ? `${user.value.nickName} · 作者主页` : '用户主页'),
  ogDescription: () => user.value?.bio || user.value?.nickName || '',
  ogType: 'profile'
})
</script>

<template>
  <div class="space-y-12">
    <!-- 资料区：C 版不用面板（底色 + 边框 + 径向光晕那套已废），只留底线分隔 -->
    <section>
      <p class="font-mono text-xs uppercase tracking-[0.08em] text-primary-fg">01 // AUTHOR</p>
      <div v-if="user" class="mt-4 flex items-center gap-4 border-b border-border pb-6">
        <AppAvatar :name="user.nickName" :src="user.avatarUrl" size="lg" />
        <div class="min-w-0">
          <h1 class="font-serif text-2xl font-bold tracking-[var(--ls-h1)] md:text-3xl">{{ user.nickName }}</h1>
          <p class="mt-1.5 text-sm text-muted">{{ user.bio || '这个人很懒，什么都没写～' }}</p>
        </div>
      </div>
      <p v-else-if="userError" class="mt-4 text-sm text-muted">该用户不存在或资料不可见。</p>
    </section>

    <!-- 公开文章 -->
    <section>
      <SectionMark index="02" title="TA 的公开文章">
        <template #right>
          <span class="ml-auto font-mono text-xs uppercase tracking-[0.08em] text-dim">
            共 {{ articles?.total ?? 0 }} 篇
          </span>
        </template>
      </SectionMark>

      <ArticleListSkeleton v-if="status === 'pending'" class="mt-6" :count="4" />
      <template v-else>
        <div v-if="rows.length" class="mt-2">
          <PostRow v-for="a in rows" :key="a.articleId" :article="a" />
        </div>
        <EmptyState
          v-else
          class="mt-10"
          title="暂无公开文章"
          description="这位作者还没有公开的文章。"
        />
        <AppPagination
          class="mt-8"
          :page="page"
          :total="articles?.total ?? 0"
          :page-size="pageSize"
          :link-for="(n) => ({ path: `/user/${userId}`, query: n > 1 ? { page: n } : {} })"
        />
      </template>
    </section>

    <CtaBand />
  </div>
</template>
