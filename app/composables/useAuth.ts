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
 *
 * ⚠️ 必须用 useRequestFetch() 而非全局 $fetch：SSR 阶段全局 $fetch 的内部请求
 * **不转发浏览器 Cookie**，session 端点拿不到 token 恒返回未登录——社交登录 302 落地、
 * 直接刷新、直达 /me 全部掉登录态（S14 实测：payload 里 auth-session 恒为 logged:false，
 * 而同 cookie 直连该 API 返回 logged:true）。useRequestFetch 绑定当前请求事件并转发请求头。
 * 客户端导航时 requestFetch 退化为普通 fetch，浏览器自动带 cookie，行为不变。
 */
export function useAuth() {
  const requestFetch = useRequestFetch()
  const { data: session, refresh, status } = useAsyncData<Session>('auth-session', () => requestFetch('/api/auth/session'), {
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

  /**
   * 注册（PRD §5.1 AUTH-01）。注意：**注册不产生登录态**——后端 `/auth/register` 返回 `R<Void>`
   * 且会消费掉本次验证码，同一组 code+uuid 无法复用于登录，故这里不像 login 那样 refresh()，
   * 调用方应在成功后引导用户回到登录再认证一次。
   */
  async function register(payload: { username: string; password: string; code?: string; uuid?: string }) {
    await $fetch('/api/auth/register', { method: 'POST', body: payload })
  }

  return { session, status, ready, logged, profile, login, logout, register, refresh }
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
