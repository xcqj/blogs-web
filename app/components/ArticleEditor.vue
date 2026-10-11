<script setup lang="ts">
// 富文本编辑器（S12 / D29）：WangEditor 6.4.1，与 plus-ui 同款同版本，保证两端产出 HTML 一致、
// 后端 jsoup 净化链路无格式分叉。纯浏览器组件 → 使用处必须 <ClientOnly> + 路由 ssr:false。
// 图片上传走本站 /api/resource/oss/upload 代理（契约 §2.4），token/clientid 由服务端注入。
// 与 plus-ui 的差异（已上报待决）：正文内直接存真实 OSS URL，不写 oss://{ossId} 标记——
// 因为解析标记的 /resource/oss/listByIds 是需登录接口，匿名读者无法解析会看到破图。
import '@wangeditor-next/editor/dist/css/style.css';
import { Editor as WangEditor, Toolbar as WangToolbar } from '@wangeditor-next/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor-next/editor';
import type { OssUploadResult } from '~/types/author';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    readOnly?: boolean;
    minHeight?: number;
    placeholder?: string;
    maxImageMb?: number;
  }>(),
  { modelValue: '', readOnly: false, minHeight: 360, placeholder: '开始写作…（支持粘贴图片自动上传）', maxImageMb: 5 }
);

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const mode = 'default';
const editorRef = shallowRef<IDomEditor>();
const valueHtml = ref(props.modelValue);
const uploadError = ref('');

// 外部值 → 内部（避免自身 emit 回环）
watch(
  () => props.modelValue,
  (v) => {
    if ((v || '') !== valueHtml.value) valueHtml.value = v || '';
  }
);
// 内部 → 外部
watch(valueHtml, (v) => emit('update:modelValue', v));

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

async function uploadToOss(file: File): Promise<OssUploadResult> {
  const fd = new FormData();
  fd.append('file', file);
  return await $fetch<OssUploadResult>('/api/resource/oss/upload', { method: 'POST', body: fd });
}

const toolbarConfig: Partial<IToolbarConfig> = {
  // 博客正文不需要全屏与清理样式，避免误触丢内容
  excludeKeys: ['fullScreen', 'groupjustify']
};

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder,
  autoFocus: false,
  readOnly: props.readOnly,
  MENU_CONF: {
    uploadImage: {
      allowedFileTypes: ALLOWED,
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        uploadError.value = '';
        if (!ALLOWED.includes(file.type)) {
          uploadError.value = `不支持的图片格式：${file.type || '未知'}`;
          return;
        }
        if (file.size / 1024 / 1024 > props.maxImageMb) {
          uploadError.value = `图片大小不能超过 ${props.maxImageMb} MB`;
          return;
        }
        try {
          const res = await uploadToOss(file);
          insertFn(res.url, file.name, res.url);
        } catch (e: any) {
          uploadError.value = apiErrorText(e, '图片上传失败');
        }
      }
    }
  }
}));

function syncState(editor?: IDomEditor) {
  if (!editor) return;
  props.readOnly ? editor.disable() : editor.enable();
}

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
  syncState(editor);
}

watch(() => props.readOnly, () => syncState(editorRef.value));

onBeforeUnmount(() => editorRef.value?.destroy());
</script>

<template>
  <div class="overflow-hidden rounded-md border border-border">
    <WangToolbar class="ed-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
    <WangEditor
      v-model="valueHtml"
      class="ed-body"
      :style="{ minHeight: `${minHeight}px`, overflowY: 'hidden' }"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
    />
    <p v-if="uploadError" class="sd-hint px-3 pb-2 text-danger">{{ uploadError }}</p>
  </div>
</template>

<style scoped>
/* 编辑器跟随主题：工具条底色/分隔线取 token，正文区用 elevated */
.ed-toolbar {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.ed-body {
  background: var(--elevated);
  color: var(--text);
}
</style>
