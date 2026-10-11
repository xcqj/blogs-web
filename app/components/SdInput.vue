<script setup lang="ts">
// 基础输入：封装 sd-input shortcut + a11y 编织（label/for、aria-describedby、aria-invalid）。
// - 不传 label 时渲染裸输入（LoginModal 一行多控场景），不产生 field 间距
// - error 优先于 hint 展示，两者都自动挂到 aria-describedby
// - id 用 Vue 3.5 useId()（SSR 安全，服务端客户端同值，不闪键）
interface Props {
  modelValue?: string
  label?: string
  hint?: string
  error?: string
  type?: string
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), { modelValue: '', type: 'text' })
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const uid = useId()
const inputId = computed(() => props.id || `sd-in-${uid}`)
const descId = `sd-desc-${uid}`
</script>

<template>
  <div :class="label || hint || error ? 'sd-field' : ''">
    <label v-if="label" :for="inputId" class="sd-label">{{ label }}</label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      class="sd-input"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error || hint ? descId : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" :id="descId" class="sd-hint text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="descId" class="sd-hint">{{ hint }}</p>
  </div>
</template>
