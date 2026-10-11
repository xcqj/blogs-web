export interface AuthProfile {
  userId?: string
  nickName?: string
  avatar?: string
  // 解析后的头像 URL（后端翻译字段；avatar 是 ossId 不可直接作 src）
  avatarUrl?: string | null
  bio?: string
}
interface Session {
  logged: boolean
  profile: AuthProfile | null
}

/**
 * 登录态：SSR 可读（useAsyncData 走 /api/auth/session，服务端读 httpOnly cookie）。
 * 浏览器不持有 token，只拿到脱敏的登录状态与昵称头像。
 */
export function useAuth() {
  const { data: session, refresh, status } = useAsyncData<Session>('auth-session', () => $fetch('/api/auth/session'), {
    lazy: true,
    default: () => ({ logged: false, profile: null })
  })

  const logged = computed(() => session.value?.logged ?? false)
  const profile = computed<AuthProfile | null>(() => session.value?.profile ?? null)
  /** 会话是否已从服务端解析完成（守卫必须等它，否则 SSR 默认值会误判未登录） */
  const ready = computed(() => status.value !== 'pending')

  async function login(payload: { username: string; password: string; code?: string; uuid?: string }) {
    await $fetch('/api/auth/login', { method: 'POST', body: payload })
    await refresh()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refresh()
  }

  return { session, status, ready, logged, profile, login, logout, refresh }
}

/**
 * 作者中心客户端登录守卫（§2.8 锁定：/me/** 复用 default 布局，未登录唤起 LoginModal，
 * 不做后台式 RBAC 动态路由）。等会话 ready 后再判定，避免 lazy 请求未回来时误弹。
 */
export function useRequireAuth() {
  const { logged, ready, profile } = useAuth()
  const { show: showLogin } = useLoginModal()

  watch(
    ready,
    (ok) => {
      if (ok && !logged.value) showLogin()
    },
    { immediate: true }
  )

  return { logged, ready, profile, showLogin }
}

/** 登录弹层的开合状态（跨组件共享，useState 保证 SSR 安全、非浏览器 API）。 */
export function useLoginModal() {
  const open = useState<boolean>('login-modal-open', () => false)
  return {
    open,
    show: () => (open.value = true),
    hide: () => (open.value = false)
  }
}
