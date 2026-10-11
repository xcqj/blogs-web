<script setup lang="ts">
// 评论列表（design/article.html .comments / .cmt 结构，§10.1 一级评论）。全站唯一评论展示组件。
import type { Comment } from '~/types/blog'

defineProps<{ items?: Comment[] }>()
</script>

<template>
  <ul class="divide-y divide-border">
    <li v-for="c in items" :key="c.commentId" class="flex gap-3 py-4">
      <AppAvatar :name="c.userName" size="sm" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="font-semibold">{{ c.userName }}</span>
          <span class="text-xs text-muted">{{ c.createTime }}</span>
        </div>
        <!-- 评论为纯文本字段：{{ }} 自动转义，绝不 v-html（后端已按 sanitizePlainText 净化） -->
        <p class="mt-1.5 whitespace-pre-wrap break-words text-sm">{{ c.content }}</p>
      </div>
    </li>
  </ul>
</template>
