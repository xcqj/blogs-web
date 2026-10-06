<script setup lang="ts">
const { open, hide } = useLoginModal()
const { login } = useAuth()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await login({ username: form.username, password: form.password })
    hide()
    form.password = ''
  } catch (e: any) {
    // 后端开启验证码时此处会失败，验证码链路属后续切片（本弹层为 S9 骨架）
    error.value = e?.statusMessage || e?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" @click.self="hide">
    <div class="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-semibold">登录</h2>
        <button class="text-gray-400 hover:text-gray-600" @click="hide">✕</button>
      </div>

      <form class="space-y-3" @submit.prevent="submit">
        <input
          v-model="form.username"
          type="text"
          placeholder="用户名"
          autocomplete="username"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="密码"
          autocomplete="current-password"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded bg-primary py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>
