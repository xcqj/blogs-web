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
// 压缩前的硬上限：只为挡住会噎住浏览器的超大文件。业务上限（maxImageMb）在压缩之后再查——
// 否则 8MB 的截图会在压缩前就被误拒。
const HARD_LIMIT_MB = 20;

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
        // 硬上限挡超大文件；业务上限在压缩后再查（S27：8MB 截图压到 200KB 后应能通过）
        if (file.size / 1024 / 1024 > HARD_LIMIT_MB) {
          uploadError.value = `图片过大（上限 ${HARD_LIMIT_MB} MB），请先裁剪`;
          return;
        }
        try {
          const payload = await compressImage(file);
          if (payload.size / 1024 / 1024 > props.maxImageMb) {
            const mb = (payload.size / 1024 / 1024).toFixed(1);
            uploadError.value = `图片大小不能超过 ${props.maxImageMb} MB（压缩后仍为 ${mb} MB）`;
            return;
          }
          const res = await uploadToOss(payload);
          // alt 用压缩后的文件名（扩展名可能已由 png/webp 变为 jpg）
          insertFn(res.url, payload.name, res.url);
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
  <!-- 外层**不能** overflow-hidden：WangEditor 的语言/对齐等下拉面板挂在编辑器内部，
       祖先是 overflow:hidden 时面板会被直接裁掉（只看到半截列表 + 滚动条消失）。
       圆角改由 toolbar（上两角）与 body（下两角）各自承担。 -->
  <div class="rounded-md border border-border">
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
  /* 外层不再 overflow-hidden，圆角由上下两段各自承担（否则工作区会露出直角） */
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}
.ed-body {
  background: var(--elevated);
  color: var(--text);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}
</style>

<style>
/* WangEditor 下拉浮层（方向 C，S23-T16）：以下是第三方 DOM（@wangeditor-next/editor dist/css），
   不能 scoped，否则选择器带 data 属性匹配不到。
   修三处：① 面板过窄 → 出横向滚动条；② 无边框阴影 → 白底上"浮不起来"；③ 滚动条几乎不可见。
   浮层阴影是 C 版唯一允许的阴影（--shadow-float），仅此处与弹层/抽屉可用。 */
.w-e-select-list,
.w-e-drop-panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-float);
}

/* 语言选择列表：给足最小宽度（默认过窄会挤成横向滚动），高度走纵向滚动 */
.w-e-select-list {
  min-width: 200px;
  max-height: 280px;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 通用下拉面板（代码块语言、对齐方式等） */
.w-e-drop-panel {
  max-height: 340px;
  overflow: auto;
  /* 外层去掉 overflow-hidden 后，面板需显式浮在正文之上（站点顶栏 z-50） */
  z-index: 60;
}

/* 滚动条：默认几乎看不见，明确给 8px 细条 */
.w-e-select-list::-webkit-scrollbar,
.w-e-drop-panel::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.w-e-select-list::-webkit-scrollbar-thumb,
.w-e-drop-panel::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: var(--radius-full);
}
.w-e-select-list::-webkit-scrollbar-track,
.w-e-drop-panel::-webkit-scrollbar-track {
  background: transparent;
}

/* ---------- 主题跟随（方向 C，S23）----------
   WangEditor 把全部配色收在 17 个 CSS 变量里（定义在 `:host,:root`），
   所以不必逐类覆盖——重新赋值即可让工具条、下拉、弹窗、书写区、代码块一起跟随。
   值全部指向本站 token，深浅主题自动切换（token 本身随 .dark 变）。
   特异性用 `:root:root` 而非 `:root`：WangEditor 的 dist CSS 由组件 import 注入，
   在全局样式之后加载，同特异性会被它盖掉。 */
:root:root {
  --w-e-textarea-bg-color: var(--elevated); /* 书写区：比面板亮一档 */
  --w-e-textarea-color: var(--text);
  --w-e-textarea-border-color: var(--border);
  --w-e-textarea-slight-border-color: var(--border);
  --w-e-textarea-slight-color: var(--text-dim);
  --w-e-textarea-slight-bg-color: var(--surface); /* 代码块/引用底：比书写区暗，形成凹陷 */
  --w-e-textarea-selected-border-color: var(--accent);
  --w-e-textarea-handler-bg-color: var(--accent);
  --w-e-toolbar-color: var(--text-muted);
  --w-e-toolbar-bg-color: var(--surface);
  --w-e-toolbar-active-color: var(--text);
  --w-e-toolbar-active-bg-color: var(--elevated); /* 工具条 hover / 激活底 */
  --w-e-toolbar-disabled-color: var(--text-dim);
  --w-e-toolbar-border-color: var(--border);
  --w-e-modal-button-bg-color: var(--elevated);
  --w-e-modal-button-border-color: var(--border-strong);
}

/* 变量管不到的两处硬编码白底（其余 #fff 是字体/背景调色板色块，属功能性，不能改） */
.w-e-text-container [data-slate-editor] pre.w-e-code-block .w-e-code-block-copy-button {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-muted);
}
.w-e-text-container [data-slate-editor] pre.w-e-code-block .w-e-code-block-copy-button:hover {
  color: var(--text);
}
/* 表格选区高亮：原为 hsla(0,0%,100%,.95)，深色下是一块刺眼白 */
.w-e-text-container [data-slate-editor] .w-e-table-selection-segment {
  background: var(--accent-soft);
}
</style>
