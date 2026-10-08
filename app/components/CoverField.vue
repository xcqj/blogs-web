<script setup lang="ts">
// 封面（契约 §2.4：复用 /resource/oss/upload，本站代理注入认证头；契约 §3.1 coverUrl 非必填、≤500 字）。
// 存的是后端返回的真实可访问 URL（与正文图片同一策略，见 ArticleEditor 顶部说明）。
import type { OssUploadResult } from '~/types/author';

const props = withDefaults(defineProps<{ modelValue?: string; maxSizeMb?: number }>(), {
  modelValue: '',
  maxSizeMb: 5
});
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const error = ref('');

function pick() {
  fileInput.value?.click();
}

async function onChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ''; // 允许连续选同一文件
  if (!file) return;
  error.value = '';
  if (!ALLOWED.includes(file.type)) {
    error.value = `不支持的图片格式：${file.type || '未知'}`;
    return;
  }
  if (file.size / 1024 / 1024 > props.maxSizeMb) {
    error.value = `封面大小不能超过 ${props.maxSizeMb} MB`;
    return;
  }
  uploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await $fetch<OssUploadResult>('/api/resource/oss/upload', { method: 'POST', body: fd });
    emit('update:modelValue', res.url);
  } catch (err: any) {
    error.value = apiErrorText(err, '封面上传失败');
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div>
    <div v-if="modelValue" class="relative w-full max-w-md overflow-hidden rounded-md border border-border">
      <img :src="modelValue" alt="封面预览" class="aspect-[16/9] w-full object-cover" />
      <button class="sd-act absolute right-2 top-2" @click="emit('update:modelValue', '')">移除</button>
    </div>
    <div v-else class="cover-drop flex h-30 w-full max-w-md items-center justify-center rounded-md border border-dashed border-border bg-surface text-sm text-muted">
      暂无封面（可选）
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <button class="sd-act" :disabled="uploading" @click="pick">
        <span class="i-mdi:upload" aria-hidden="true" />{{ uploading ? '上传中…' : '上传封面' }}
      </button>
      <input
        class="sd-input max-w-80 flex-1"
        :value="modelValue"
        placeholder="或粘贴图片 URL"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onChange" />
    </div>
    <p v-if="error" class="sd-hint text-danger">{{ error }}</p>
    <p v-else class="sd-hint">支持 jpg/png/gif/webp，≤{{ maxSizeMb }}MB；封面地址随文章一起保存</p>
  </div>
</template>
