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
  <!-- 遮罩用 Transition 淡入（v-if 进出），面板用 CSS 动画弹出；
       不对全屏遮罩做缩放，否则边缘会露出背景 -->
  <Transition name="sd-fade">
    <div v-if="open" class="sd-scrim z-50 flex items-center justify-center px-4" @click.self="hide">
      <!-- 面板（打磨轮 9）：品牌母题 + 一句副文案打头，字段带 label（不再只靠 placeholder），
           底部一行说明，按钮走与导航登录同款的滚轴 -->
      <div ref="modalEl" class="sd-pop-in w-full max-w-[360px] rounded-lg border border-border bg-elevated p-6 shadow-e3">
        <div class="mb-5 flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <!-- 叠框母题（与 logo/空态同源），两条 rect 各绑主题变量 -->
            <svg class="h-7 w-7 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="6" y="10" width="22" height="22" rx="6" stroke="var(--logo-back)" stroke-width="2.6" />
              <rect x="12" y="6" width="22" height="22" rx="6" stroke="var(--logo-front)" stroke-width="2.6" />
            </svg>
            <div>
              <h2 class="text-base font-bold tracking-[var(--ls-title)]">登录</h2>
              <p class="mt-0.5 text-xs text-dim">登录后即可评论与写作</p>
            </div>
          </div>
          <button
            class="rounded-sm p-1.5 text-dim transition hover:bg-raised hover:text-text"
            aria-label="关闭登录框"
            @click="hide"
          >
            ✕
          </button>
        </div>

        <form class="space-y-3.5" @submit.prevent="submit">
          <SdInput v-model="form.username" label="用户名" placeholder="请输入用户名" autocomplete="username" />
          <SdInput
            v-model="form.password"
            type="password"
            label="密码"
            placeholder="请输入密码"
            autocomplete="current-password"
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
            :label="loading ? '登录中…' : '登录'"
            :disabled="loading"
            class="mt-1"
          />

          <!-- PRD v0.2 §3.1/§16：不存在独立的「作者资格申请」流程，注册后即可发文。
               原「请联系管理员开通」属 v0.1 USER/AUTHOR 分层时代的口径，已作废。 -->
          <p class="text-xs text-dim">
            还没有账号？<NuxtLink to="/register" class="text-primary hover:underline" @click="hide">立即注册</NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </Transition>
</template>
