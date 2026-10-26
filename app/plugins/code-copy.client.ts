// prose 代码块增强（质感精修轮清单5 + 方向 C S23-T16 顶部栏）。
// - `.client.ts` 后缀 = 仅客户端插件，天然不进 SSR 产物；所有浏览器 API 只出现在
//   本文件与生命周期钩子内，渲染期不裸用（SSR 安全红线）。
// - 注入时机：hydration 后（app:mounted）+ SPA 路由切换后（page:finish 等 nextTick），
//   文章正文是 SSR v-html 产物，Vue 不逐节点管理它，包容器不会引发 hydration mismatch。
// - 结构（方向 C）：.sd-code 容器 > .sd-code-bar（左语言标签 / 右复制钮）+ pre。
//   顶部栏用等宽大写小字，与全站 meta 语言同族；语言取自 code 元素的 language-xxx 类，
//   没有则显示 CODE（不编造文件名——正文 HTML 里没有这个信息）。
// - 图标类名（i-mdi:*）以字面量写在本文件中：UnoCSS 按源码提取类名生成规则，
//   运行时动态拼的类名不会生成 CSS。execCommand 兜底覆盖非安全上下文/旧浏览器。
export default defineNuxtPlugin((nuxtApp) => {
  const ICON_COPY = '<span class="i-mdi:content-copy" aria-hidden="true"></span>'
  const ICON_OK = '<span class="i-mdi:check" aria-hidden="true"></span>'

  /** 从 <code class="language-xxx"> 提取语言名；无则回落 CODE */
  function detectLang(pre: HTMLElement): string {
    const code = pre.querySelector('code')
    const m = (code?.className || '').match(/language-([\w+#-]+)/)
    return (m?.[1] || 'code').toUpperCase()
  }

  function enhance() {
    document.querySelectorAll<HTMLElement>('.prose pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('sd-code')) return // 已包装，防重复

      const wrap = document.createElement('div')
      wrap.className = 'sd-code'

      const bar = document.createElement('div')
      bar.className = 'sd-code-bar'

      const lang = document.createElement('span')
      lang.className = 'sd-code-lang'
      lang.textContent = detectLang(pre)

      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'sd-code-copy'
      btn.setAttribute('aria-label', '复制代码')
      btn.innerHTML = ICON_COPY

      let resetTimer: ReturnType<typeof setTimeout> | undefined
      btn.addEventListener('click', async () => {
        const text = pre.innerText
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // 兜底：非安全上下文或旧浏览器无 async clipboard API
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          ta.remove()
        }
        btn.innerHTML = ICON_OK
        btn.classList.add('is-copied')
        clearTimeout(resetTimer)
        resetTimer = setTimeout(() => {
          btn.innerHTML = ICON_COPY
          btn.classList.remove('is-copied')
        }, 1200)
      })

      bar.append(lang, btn)

      pre.parentNode?.insertBefore(wrap, pre)
      wrap.append(bar, pre)
    })
  }

  nuxtApp.hook('app:mounted', enhance)
  // SPA 导航到新文章：等 DOM 更新完再注入（page:finish 时新页面已挂载）
  nuxtApp.hook('page:finish', () => nextTick(enhance))
})
