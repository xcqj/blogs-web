<script setup lang="ts">
// 滚轴按钮（打磨轮 9，借鉴 neura-nova 的 .primary-button：文字与箭头各两份，
// overflow-hidden 遮罩内 hover 时整行上滚，第二份补位——详见 tokens.css 的 .sd-roll 系列）。
// - 内容由 props 给（label / icon），SdButton 的全部属性经 $attrs 透传（variant/size/to/type/loading…）
// - 第二份文案与图标均为 aria-hidden，读屏只念一次；键盘 focus 也触发滚动（:focus-visible 见 tokens.css）
interface Props {
  label: string
  icon?: string
}

withDefaults(defineProps<Props>(), { icon: 'i-mdi:arrow-right' })
</script>

<template>
  <SdButton v-bind="$attrs" class="group">
    <span class="sd-roll">
      <span>{{ label }}</span>
      <span aria-hidden="true">{{ label }}</span>
    </span>
    <span class="sd-roll-icon" aria-hidden="true">
      <span :class="icon" />
      <span :class="icon" />
    </span>
  </SdButton>
</template>
