<script setup lang="ts">
const { open, hide } = useLoginModal()
const { login } = useAuth()

const form = reactive({ username: '', password: '', code: '' })
const uuid = ref('')
const captchaImg = ref('')
const captchaEnabled = ref(true)
const loading = ref(false)
const error = ref('')

async function refreshCaptcha() {
  try {
    const c = await $fetch<{ captchaEnabled: boolean; uuid: string; img: string }>('/api/auth/captcha')
    captchaEnabled.value = c.captchaEnabled !== false
    captchaImg.value = c.img || ''
    uuid.value = c.uuid || ''
    form.code = ''
  } catch {
    captchaEnabled.value = false
  }
}

// 打开弹层时拉取验证码（仅客户端，LoginModal 由 <ClientOnly> 包裹，SSR-safe）
watch(open, (v) => { if (v) refreshCaptcha() }, { immediate: true })

// 交互统一走 useModalA11y（L3）：ESC 关闭 + 背景滚动锁 + 焦点圈定与归还。
// 不再自写 addEventListener，避免与抽屉/确认框三处各缺一样。
const modalEl = ref<HTMLElement>();
useModalA11y({ isOpen: () => open.value, container: () => modalEl.value, onClose: hide });

async function submit() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await login({ username: form.username, password: form.password, code: form.code, uuid: uuid.value })
    hide()
    form.password = ''
    form.code = ''
  } catch (e: any) {
    error.value = apiErrorText(e, '登录失败')
    refreshCaptcha() // 验证码一次性，失败后刷新重试
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="open" class="sd-scrim z-50 flex items-center justify-center px-4" @click.self="hide">
    <div ref="modalEl" class="w-full max-w-sm rounded-lg border border-border bg-elevated p-5 shadow-e3">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-semibold">登录</h2>
        <button class="rounded-sm p-1.5 text-dim transition hover:bg-raised hover:text-text" aria-label="关闭登录框" @click="hide">✕</button>
      </div>

      <form class="space-y-3" @submit.prevent="submit">
        <input
          v-model="form.username"
          type="text"
          placeholder="用户名"
          aria-label="用户名"
          autocomplete="username"
          class="sd-input"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="密码"
          aria-label="密码"
          autocomplete="current-password"
          class="sd-input"
        />

        <div v-if="captchaEnabled" class="flex items-center gap-2">
          <input
            v-model="form.code"
            type="text"
            placeholder="验证码"
            autocomplete="off"
            class="sd-input min-w-0 flex-1"
          />
          <!-- base64 验证码图，点击刷新；不缓存 -->
          <img
            v-if="captchaImg"
            :src="`data:image/png;base64,${captchaImg}`"
            alt="验证码"
            class="h-9 w-24 cursor-pointer rounded-md border border-border"
            title="点击刷新"
            @click="refreshCaptcha"
          />
        </div>

        <p v-if="error" class="text-xs text-danger">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>
