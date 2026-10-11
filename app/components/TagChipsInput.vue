<script setup lang="ts">
// 标签输入（§2.8 锁定：标签随文提交 tagNames，1~6 个；新标签后端自动入库）。
// 记忆偏好：输入即提交（回车/失焦/粘贴均可），去重不区分大小写，超上限静默丢弃并靠 hint 反馈。
const props = defineProps<{ modelValue?: string[]; max?: number }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>();

const max = computed(() => props.max ?? 6);
const list = computed(() => props.modelValue ?? []);
const draft = ref('');

function push(values: string[]) {
  const next = [...list.value];
  for (const raw of values) {
    const t = raw.trim();
    if (!t) continue;
    if (next.length >= max.value) break;
    if (next.some((x) => x.toLowerCase() === t.toLowerCase())) continue;
    next.push(t);
  }
  emit('update:modelValue', next);
}

function commit() {
  if (!draft.value.trim()) return;
  push(draft.value.split(/[,，]/));
  draft.value = '';
}

function onPaste(e: ClipboardEvent) {
  const text = e.clipboardData?.getData('text') ?? '';
  if (/[,，\n]/.test(text)) {
    e.preventDefault();
    push(text.split(/[,，\n]/));
  }
}

function removeAt(i: number) {
  const next = [...list.value];
  next.splice(i, 1);
  emit('update:modelValue', next);
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface p-2">
      <span v-for="(t, i) in list" :key="t" class="sd-chip">
        {{ t }}
        <button class="ml-1 not-italic opacity-60 transition hover:opacity-100" :aria-label="`移除标签 ${t}`" @click="removeAt(i)">
          ✕
        </button>
      </span>
      <input
        v-model="draft"
        type="text"
        class="min-w-28 flex-1 bg-transparent px-1 text-sm text-text outline-none"
        :placeholder="list.length >= max ? '已达上限' : list.length ? '继续添加…' : '回车添加，1~6 个'"
        :disabled="list.length >= max"
        @keydown.enter.prevent="commit"
        @blur="commit"
        @paste="onPaste"
      />
    </div>
    <p class="sd-hint">已用 {{ list.length }}/{{ max }}；输入即添加，支持逗号或粘贴批量输入</p>
  </div>
</template>
