<script setup lang="ts">
const props = defineProps<{ articleId: string }>()
const emit = defineEmits<{ (e: 'posted'): void }>()

const { logged } = useAuth()
const { show: showLogin } = useLoginModal()

const content = ref('')
const submitting = ref(false)
const err = ref('')

async function submit() {
  if (!content.value.trim() || submitting.value) return
  submitting.value = true
  err.value = ''
  try {
    await $fetch(`/api/blog/article/${props.articleId}/comments`, { method: 'POST', body: { content: content.value } })
    content.value = ''
    emit('posted') // 通知父级刷新评论列表
  } catch (e: any) {
    err.value = apiErrorText(e, '发表失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mt-6">
    <template v-if="logged">
      <SdTextarea v-model="content" :rows="3" placeholder="写下你的评论…" />
      <div class="mt-3 flex items-center gap-3">
        <SdButton :disabled="submitting || !content.trim()" @click="submit">
          {{ submitting ? '提交中…' : '发表评论' }}
        </SdButton>
        <span v-if="err" class="text-xs text-danger">{{ err }}</span>
      </div>
    </template>
    <!-- 未登录：详情页唯一转化点——统一空态母题（说明文案 + 明确登录按钮），
         不再用角落里的裸文字链；窄栏（68ch）用 compact 图标 -->
    <EmptyState
      v-else
      icon-class="h-16 w-16"
      title="登录后参与讨论"
      description="登录即可发表评论，与作者和读者交流你的阅读体会。"
    >
      <SdButton class="mt-1" @click="showLogin">去登录</SdButton>
    </EmptyState>
  </div>
</template>
