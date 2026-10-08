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
      <textarea
        v-model="content"
        rows="3"
        placeholder="写下你的评论…"
        class="sd-textarea"
      />
      <div class="mt-3 flex items-center gap-3">
        <button :disabled="submitting || !content.trim()" class="btn-primary" @click="submit">
          {{ submitting ? '提交中…' : '发表评论' }}
        </button>
        <span v-if="err" class="text-xs text-danger">{{ err }}</span>
      </div>
    </template>
    <button v-else class="text-sm text-primary hover:underline" @click="showLogin">登录后可发表评论</button>
  </div>
</template>
