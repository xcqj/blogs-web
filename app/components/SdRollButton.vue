<script setup lang="ts">
// 滚轴按钮（打磨轮 9 修订，借鉴 neura-nova 的 .primary-button）：
// - **逐字滚动**：label 拆成字符，每字一个遮罩（两份同字堆叠），hover 时逐字上滚并依次延迟
//   （--i 递增 delay；离开时反向，末字先落）——整块文字一起滚是错的，观感差很多
// - 箭头图标两份用绝对定位叠在圆内（上一版用 flex 竖排会把图标顶出圆圈）
// - 无障碍：滚动内容整体 aria-hidden，语义由按钮的 aria-label 承担（否则读屏会逐字念）
interface Props {
  label: string
  icon?: string
  // 透传给 SdButton 的 variant：声明式 prop 不进 $attrs，必须显式绑定（默认 primary 保持旧行为）
  variant?: 'primary' | 'secondary' | 'cta' | 'ghost' | 'soft' | 'danger'
}

const props = withDefaults(defineProps<Props>(), { icon: 'i-mdi:arrow-right', variant: 'primary' })

// 空格换成不换行空格，避免被折叠导致字符遮罩错位
const chars = computed(() => [...props.label].map((c) => (c === ' ' ? '\u00A0' : c)))
</script>

<template>
  <SdButton v-bind="$attrs" class="group" :variant="variant" :aria-label="label">
    <span class="sd-roll-chars" aria-hidden="true" :style="{ '--n': chars.length }">
      <span v-for="(ch, i) in chars" :key="i" class="sd-roll" :style="{ '--i': i }">
        <span>{{ ch }}</span>
        <span>{{ ch }}</span>
      </span>
    </span>
    <!-- 图标再包一层：i-mdi 类自带固定宽高（1.2em），直接给外层 span 会压掉 inset:0 的撑满与居中 -->
    <span class="sd-roll-icon" aria-hidden="true">
      <span><i :class="icon" /></span>
      <span><i :class="icon" /></span>
    </span>
  </SdButton>
</template>
