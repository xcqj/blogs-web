<script setup lang="ts">
import type { ArticleSummary, PageResult, PublicUser } from '~/types/blog'

// /user/{userId} —— §9.1 公开资料 + §9.2 其公开文章（复用 §5.1 authorId 过滤，plan §2.1）。
const route = useRoute()
const userId = computed(() => String(route.params.userId || ''))
const pageSize = 20

const { data: user, error: userError } = await useAsyncData(
  `user-${userId.value}`,
  () => $fetch<PublicUser>(`/api/blog/public/users/${userId.value}`),
  { watch: [userId] }
)
const { data: articles } = await useAsyncData(
  `user-articles-${userId.value}`,
  () => $fetch<PageResult<ArticleSummary>>('/api/blog/public/articles', {
    query: { authorId: userId.value, pageNum: 1, pageSize }
  }),
  { watch: [userId] }
)

useSeoMeta({ title: () => (user.value ? `${user.value.nickName} · 博客前台` : '用户') })
</script>

<template>
  <section class="space-y-6">
    <!-- 资料卡 -->
    <div class="rounded-lg border border-gray-100 bg-white p-5">
      <template v-if="user">
        <div class="flex items-center gap-4">
          <img
            v-if="user.avatarUrl"
            :src="user.avatarUrl"
            :alt="user.nickName"
            class="h-14 w-14 rounded-full object-cover"
          />
          <span v-else class="i-mdi:account-circle flex h-14 w-14 items-center justify-center text-4xl text-gray-300" />
          <div class="min-w-0">
            <h1 class="text-lg font-bold">{{ user.nickName }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ user.bio || '这个人很懒，什么都没写～' }}</p>
          </div>
        </div>
      </template>
      <p v-else class="text-sm text-gray-400">
        {{ userError ? '用户不存在或资料不可见' : '加载中…' }}
      </p>
    </div>

    <!-- 公开文章 -->
    <div class="space-y-3">
      <h2 class="text-base font-semibold text-gray-700">TA 的公开文章 {{ articles?.total ?? 0 }}</h2>
      <ArticleCard v-for="a in articles?.rows" :key="a.articleId" :article="a" />
      <p v-if="user && !articles?.rows?.length" class="py-8 text-center text-sm text-gray-400">暂无公开文章</p>
    </div>
  </section>
</template>
