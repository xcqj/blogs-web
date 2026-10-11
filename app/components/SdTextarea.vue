<script setup lang="ts">
// 基础多行输入：与 SdInput 同一套 a11y 编织（label/for、aria-describedby、aria-invalid），
// 控件本体走 sd-textarea shortcut（min-h + resize-y + 同款 focus 环）。
interface Props {
  modelValue?: string
  label?: string
  hint?: string
  error?: string
  placeholder?: string
  rows?: number
  maxlength?: number
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), { modelValue: '', rows: 4 })

// attrs（class/aria-label 等）透传到 textarea 本体而非包裹 div；显式绑定写在其后，优先级更高
defineOptions({ inheritAttrs: false })
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const uid = useId()
const inputId = computed(() => props.id || `sd-ta-${uid}`)
const descId = `sd-desc-${uid}`
</script>

<template>
  <div :class="label || hint || error ? 'sd-field' : ''">
    <label v-if="label" :for="inputId" class="sd-label">{{ label }}</label>
    <textarea
      v-bind="$attrs"
      :id="inputId"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      class="sd-textarea"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error || hint ? descId : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" :id="descId" class="sd-hint text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="descId" class="sd-hint">{{ hint }}</p>
  </div>
</template>
