<script setup lang="ts">
// 我的文章行（design/author-articles.html .arow 基线）。
// 动作可见性严格对齐契约状态机与 D13 决议：
//   草稿        → 编辑 / 发布 / 删除
//   已发布      → 编辑 / 隐藏 / 删除
//   用户隐藏    → 编辑 / 重新公开 / 删除
//   管理员下线  → 编辑与恢复均禁用（作者不可自恢复，只能删除）——红线，前端只做体验、后端强制
import type { AuthorArticle } from '~/types/author'

const props = defineProps<{ article: AuthorArticle; busy?: boolean }>()
const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'publish'): void
  (e: 'hide'): void
  (e: 'show'): void
  (e: 'delete'): void
}>()

const isDraft = computed(() => props.article.status === '0')
const isAdminHidden = computed(() => props.article.visibility === '2')
const isUserHidden = computed(() => props.article.visibility === '1')
const isPublic = computed(() => !isDraft.value && !isAdminHidden.value && !isUserHidden.value)

const canEdit = computed(() => !isAdminHidden.value)
// D13：USER_HIDDEN / ADMIN_HIDDEN 不得借 publish 转公开
const canPublish = computed(() => isDraft.value && !isUserHidden.value && !isAdminHidden.value)
const canHide = computed(() => isPublic.value)
const canShow = computed(() => !isDraft.value && isUserHidden.value)

const updated = computed(() => (props.article.updateTime || props.article.publishedAt || '').slice(0, 10))

// 删除两步确认（不用 window.confirm，保持 SSR 安全）；离开时清掉待确认计时
const armDelete = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
function askDelete() {
  armDelete.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (armDelete.value = false), 5000)
}
function doDelete() {
  clearTimeout(timer)
  armDelete.value = false
  emit('delete')
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="sd-row">
    <div class="min-w-0 flex-1">
      <h3 class="truncate text-lg font-semibold">{{ article.title }}</h3>
      <div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <StatusBadge :status="article.status" :visibility="article.visibility" />
        <TagChip v-for="t in article.tags" :key="t.tagId" :slug="t.slug" :name="t.name" />
        <span class="sd-dot" />
        <span>更新于 {{ updated || '—' }}</span>
        <template v-if="!isDraft">
          <span class="sd-dot" />
          <span class="inline-flex items-center gap-1">
            <span class="i-mdi:eye-outline" aria-hidden="true" />{{ article.viewCount }}
          </span>
        </template>
      </div>
    </div>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <NuxtLink v-if="isPublic" :to="`/post/${article.articleId}`" class="sd-act no-underline">查看</NuxtLink>
      <button class="sd-act" :disabled="!canEdit || busy" :title="canEdit ? '' : 'ADMIN_HIDDEN 文章作者不可编辑'" @click="emit('edit')">
        编辑
      </button>
      <button v-if="canPublish" class="sd-act-primary" :disabled="busy" @click="emit('publish')">发布</button>
      <button v-if="canHide" class="sd-act" :disabled="busy" @click="emit('hide')">隐藏</button>
      <button v-if="canShow" class="sd-act-primary" :disabled="busy" @click="emit('show')">重新公开</button>
      <button
        v-if="!armDelete"
        class="sd-act-danger"
        :disabled="busy"
        @click="askDelete"
      >
        删除
      </button>
      <button v-else class="sd-act-danger font-semibold" :disabled="busy" @click="doDelete">确认删除？</button>
    </div>
  </div>
</template>
