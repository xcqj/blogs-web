<script setup lang="ts">
// /user/{userId} —— §9.1 公开资料 + 其公开文章（§5.1 authorId 过滤，等价 §9.2）。
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

useSeoMeta({
  title: () => (user.value ? `${user.value.nickName} · 作者主页` : '用户主页'),
  description: () => (user.value ? `${user.value.nickName} 的公开文章与简介。` : '用户主页。'),
  ogTitle: () => (user.value?.nickName ? `${user.value.nickName} · 作者主页` : '用户主页'),
  ogDescription: () => user.value?.bio || user.value?.nickName || '',
  ogType: 'profile'
})
</script>

<template>
  <section class="space-y-6">
    <!-- 资料 hero（design/app.css .profile-hero；用户不存在或不可见则不显示卡片） -->
    <div v-if="user" class="surface-hero flex items-center gap-4 rounded-lg border border-border p-6">
      <AppAvatar :name="user.nickName" :src="user.avatarUrl" size="lg" />
      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-[var(--ls-h2)]">{{ user.nickName }}</h1>
        <p class="mt-1 text-sm text-muted">{{ user.bio || '这个人很懒，什么都没写～' }}</p>
      </div>
    </div>
    <p v-else-if="userError" class="text-sm text-muted">该用户不存在或资料不可见。</p>

    <!-- 公开文章 -->
    <div>
      <h2 class="mb-4 text-sm uppercase tracking-[1.5px] text-muted">TA 的公开文章</h2>

      <ArticleListSkeleton v-if="status === 'pending'" :count="3" />
      <template v-else>
        <div class="space-y-3.5">
          <ArticleCard v-for="a in articles?.rows" :key="a.articleId" :article="a" />
        </div>
        <EmptyState v-if="!articles?.rows?.length" title="暂无公开文章" description="这位作者还没有公开的文章。" />
        <AppPagination
          :page="page"
          :total="articles?.total ?? 0"
          :page-size="pageSize"
          :link-for="(n) => ({ path: `/user/${userId}`, query: n > 1 ? { page: n } : {} })"
        />
      </template>
    </div>
  </section>
</template>
