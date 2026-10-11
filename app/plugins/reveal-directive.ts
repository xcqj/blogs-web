// 注册 v-reveal 指令。
// ⚠️ 实测：本项目 Nuxt 4.6 并不会自动注册 app/directives/ 下的指令
// （产物 JS 里找不到 is-revealed，说明实现文件根本没进 bundle），
// 所以在这里显式挂到 vueApp 上，实现仍留在 ../directives/reveal.ts。
import reveal from '../directives/reveal';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', reveal);
});
