<script setup lang="ts">
// /register —— 新用户注册（PRD §5.1 AUTH-01「注册」P0 + §6 前台页面清单；ROADMAP S1「账号与个人资料」）。
// 账密 + 图形验证码，复用 RuoYi 框架自带 POST /auth/register（开关 sys.account.registerUser 已在 S0
// 置 true，见 ROADMAP 第 50 行）；它不在 blog-api.md 契约范围内，故契约里查不到 /auth/**。
//
// 视觉沿用 LoginModal（叠框母题 + 带 label 的 SdInput + 滚轴按钮），保持一致的第一眼。
// 注册即登录（S22 / D35）：后端 `AuthController#register` 注册成功后直接下发 token，Nitro 代理种
// httpOnly cookie，`useAuth.register` 内已 refresh() 刷新会话——成功后跳回来源页，
// 不再有「注册完再手动登录一次」的中间态（旧口径：后端返回 R<Void> 不下发 token）。
const { logged, ready, register } = useAuth()
const { show: showLogin } = useLoginModal()
const route = useRoute()
const toast = useToast()

// 回来源页：LoginModal「立即注册」带 ?return=当前路径。仅接受站内相对路径（拒绝 // 开头与
// 协议相对地址），防开放重定向；无参数或非法值回首页。
const returnPath = computed(() => {
  const ret = route.query.return
  return typeof ret === 'string' && ret.startsWith('/') && !ret.startsWith('//') ? ret : '/'
})

const form = reactive({ username: '', password: '', confirm: '', code: '' })
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

// 验证码只在客户端拉：页面骨架仍 SSR，图像与表单属 CSR 交互
onMounted(refreshCaptcha)

async function submit() {
  if (loading.value) return
  error.value = ''
  const username = form.username.trim()
  // 与后端 RegisterBody 约束对齐：用户名 2~30、密码 5~30（@Length），先在本地挡一道，省一次往返
  if (username.length < 2 || username.length > 30) {
    error.value = '用户名需 2~30 个字符'
    return
  }
  if (form.password.length < 5 || form.password.length > 30) {
    error.value = '密码需 5~30 个字符'
    return
  }
  if (form.password !== form.confirm) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (captchaEnabled.value && !form.code) {
    error.value = '请输入验证码'
    return
  }

  loading.value = true
  try {
    await register({ username, password: form.password, code: form.code, uuid: uuid.value })
    form.password = ''
    form.confirm = ''
    form.code = ''
    // 注册即登录：会话已在 register() 内刷新，告知后跳回来源页（toast 为模块级单例，导航后仍显示）
    toast.ok('注册成功', '欢迎加入，已为你完成登录')
    navigateTo(returnPath.value)
  } catch (e: any) {
    error.value = apiErrorText(e, '注册失败')
    refreshCaptcha() // 验证码一次性：用掉即失效，失败后必须换一张
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: '注册', robots: 'noindex,follow' })
</script>

<template>
  <section class="mx-auto max-w-[420px]">
    <!-- 与 LoginModal 同源：叠框母题 + 一句副文案打头 -->
    <div class="sd-card p-6 sm:p-7">
      <div class="mb-5 flex items-center gap-2.5">
        <svg class="h-7 w-7 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="6" y="10" width="22" height="22" rx="6" stroke="var(--logo-back)" stroke-width="2.6" />
          <rect x="12" y="6" width="22" height="22" rx="6" stroke="var(--logo-front)" stroke-width="2.6" />
        </svg>
        <div>
          <h1 class="text-base font-bold tracking-[var(--ls-title)]">注册</h1>
          <p class="mt-0.5 text-xs text-dim">注册后即可写作、发布与评论</p>
        </div>
      </div>

      <!-- 已登录：注册无意义，直接给出口 -->
      <div v-if="ready && logged" class="space-y-4">
        <p class="text-sm text-muted">你已经登录了，无需再注册账号。</p>
        <div class="flex gap-2 border-t border-border pt-4">
          <SdButton variant="ghost" to="/">返回首页</SdButton>
          <SdButton to="/me">进入作者中心</SdButton>
        </div>
      </div>

      <form v-else class="space-y-3.5" @submit.prevent="submit">
        <SdInput
          v-model="form.username"
          label="用户名"
          placeholder="2~30 个字符，注册后不可修改"
          autocomplete="username"
        />
        <SdInput
          v-model="form.password"
          type="password"
          label="密码"
          placeholder="5~30 个字符"
          autocomplete="new-password"
        />
        <SdInput
          v-model="form.confirm"
          type="password"
          label="确认密码"
          placeholder="请再次输入密码"
          autocomplete="new-password"
        />

        <!-- 验证码：输入框与图片底部对齐（items-end），避免 label 把图片顶下去 -->
        <div v-if="captchaEnabled" class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SdInput v-model="form.code" label="验证码" placeholder="请输入验证码" autocomplete="off" />
          </div>
          <img
            v-if="captchaImg"
            :src="`data:image/png;base64,${captchaImg}`"
            alt="验证码"
            class="h-9.5 w-24 shrink-0 cursor-pointer rounded-md border border-border-strong"
            title="点击刷新"
            @click="refreshCaptcha"
          />
        </div>

        <p v-if="error" class="text-xs text-danger">{{ error }}</p>

        <SdRollButton
          type="submit"
          block
          :label="loading ? '注册中…' : '注册'"
          :disabled="loading"
          class="mt-1"
        />

        <p class="text-xs text-dim">
          已有账号？<button type="button" class="text-primary hover:underline" @click="showLogin()">直接登录</button>
        </p>
      </form>
    </div>
  </section>
</template>
