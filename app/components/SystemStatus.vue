<script setup lang="ts">
// Hero 右侧「系统状态卡」（方向 C，S23-T15）。
// ⚠️ 这里全部是**声明式真值**，不是运行时遥测：
//    RENDER=SSR（nuxt.config ssr:true）、THEME=dark·light（@nuxtjs/color-mode + cookie，首屏无闪烁）、
//    MOTION=transform only（动效纪律，只动 transform/opacity）、A11Y=WCAG AA（contrast.mjs 18 项门禁 + 全站 focus-visible）。
// 禁止加 build hash / 部署日期 / 性能数字——没有实测支撑的写在简历项目上是扣分项。
const rows = [
  { k: 'RENDER', v: 'SSR' },
  { k: 'FRAMEWORK', v: 'Nuxt 4' },
  { k: 'THEME', v: 'dark · light' },
  { k: 'MOTION', v: 'transform only' },
  { k: 'A11Y', v: 'WCAG AA' }
]
</script>

<template>
  <dl class="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 font-mono text-xs">
    <template v-for="row in rows" :key="row.k">
      <dt class="uppercase tracking-[0.08em] text-dim">{{ row.k }}</dt>
      <dd class="text-muted">{{ row.v }}</dd>
    </template>
  </dl>
</template>
