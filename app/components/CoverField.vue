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
// 压缩前的硬上限：只为挡住会噎住浏览器的超大文件。业务上限（maxSizeMb）在压缩之后再查——
// 否则 8MB 的截图会在压缩前就被误拒。
const HARD_LIMIT_MB = 20;
const fileInput = ref<HTMLInputElement>();
const uploading = ref(false);
const error = ref('');
// 封面地址必须是“带路径的绝对 URL”，否则预览区只会显示破图
// （实测被填过 http://img.example.com/ 这种半截值：有值但加载必然失败）
const URL_RE = /^https?:\/\/[^/\s]+\/.+/;
const imgError = ref(false);
watch(() => props.modelValue, () => { imgError.value = false; });
const invalidUrl = computed(() => !!props.modelValue && !URL_RE.test(props.modelValue));

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
  if (file.size / 1024 / 1024 > HARD_LIMIT_MB) {
    error.value = `图片过大（上限 ${HARD_LIMIT_MB} MB），请先裁剪`;
    return;
  }
  uploading.value = true;
  try {
    // 先压缩再查业务上限（S27）：压缩失败会回落原文件，绝不阻断上传
    const payload = await compressImage(file);
    if (payload.size / 1024 / 1024 > props.maxSizeMb) {
      const mb = (payload.size / 1024 / 1024).toFixed(1);
      error.value = `封面大小不能超过 ${props.maxSizeMb} MB（压缩后仍为 ${mb} MB）`;
      return;
    }
    const fd = new FormData();
    fd.append('file', payload);
    const res = await $fetch<OssUploadResult>('/api/resource/oss/upload', { method: 'POST', body: fd });
    // 后端返回的地址也要校验：OSS 配置错（双桶名、缺域名、http 截断）时不要静默写入
    if (!URL_RE.test(res?.url || '')) {
      error.value = `上传返回的地址不可用：${res?.url || '(空)'}`;
      return;
    }
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
    <div v-if="modelValue && !imgError && !invalidUrl" class="relative w-full max-w-md overflow-hidden rounded-md border border-border">
      <img :src="modelValue" alt="封面预览" class="aspect-[16/9] w-full object-cover" @error="imgError = true" />
      <button class="sd-act absolute right-2 top-2" @click="emit('update:modelValue', '')">移除</button>
    </div>
    <!-- 有值但加载失败/地址不合法：不要显示破图，直接说清楚哪里不对 -->
    <div v-else-if="modelValue" class="cover-drop flex h-30 w-full max-w-md items-center justify-center rounded-md border border-dashed border-danger bg-bg px-3 text-center text-sm text-danger">
      封面无法加载：{{ imgError ? '图片地址访问不了' : '地址格式不合法' }}
    </div>
    <!-- 虚线框位于右栏卡片内部：用 --bg（米白）而非 --surface（纯白），否则与卡片同色、虚线成了唯一线索 -->
    <div v-else class="cover-drop flex h-30 w-full max-w-md items-center justify-center rounded-md border border-dashed border-border bg-bg text-sm text-muted">
      暂无封面（可选）
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <button class="sd-act" :disabled="uploading" @click="pick">
        <span class="i-mdi:upload" aria-hidden="true" />{{ uploading ? '上传中…' : '上传封面' }}
      </button>
      <SdInput
        :model-value="modelValue"
        placeholder="或粘贴图片 URL"
        class="max-w-80 flex-1"
        @update:model-value="emit('update:modelValue', $event)"
      />
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onChange" />
    </div>
    <p v-if="error" class="sd-hint text-danger">{{ error }}</p>
    <p v-else-if="invalidUrl" class="sd-hint text-danger">封面地址需为完整 URL（形如 https://域名/路径.jpg）</p>
    <p v-else class="sd-hint">支持 jpg/png/gif/webp，≤{{ maxSizeMb }}MB；封面地址随文章一起保存</p>
  </div>
</template>
