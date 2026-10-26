<script setup lang="ts">
// 文章设置面板（方向 C，S23-T20）：摘要 + 封面 + 调用方注入的额外区块。
// 抽成纯展示组件的理由：桌面「右栏常驻」与移动端「PublishDrawer 抽屉」共用同一份标记，
// 避免两处各自演化。摘要/封面是可选项，不该占主编辑区——写作时视线不被设置项打断。
import { pickFirstImage } from '~/utils/firstImage'

const props = defineProps<{ content: string; readOnly?: boolean }>()

const summary = defineModel<string>('summary', { required: true })
const coverUrl = defineModel<string>('coverUrl', { required: true })

/** 未手动选图时将要自动采用的正文首图（与 ArticleForm 实际保存逻辑同源） */
const autoCover = computed(() => (coverUrl.value.trim() ? null : pickFirstImage(props.content)))

function adoptAutoCover() {
  if (autoCover.value) coverUrl.value = autoCover.value
}

/** 从正文纯文本前 80 字生成摘要草稿（生成后作者仍可手改） */
function fillSummaryFromContent() {
  const text =
    new DOMParser()
      .parseFromString(props.content || '', 'text/html')
      .body?.textContent?.replace(/\s+/g, ' ')
      .trim() ?? ''
  summary.value = text.slice(0, 80)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <label class="font-mono text-xs uppercase tracking-[0.08em] text-dim">摘要</label>
        <button
          class="shrink-0 text-xs text-primary-fg hover:underline disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="readOnly || !content"
          @click="fillSummaryFromContent"
        >
          从正文生成
        </button>
      </div>
      <SdTextarea
        v-model="summary"
        :rows="4"
        :maxlength="500"
        :disabled="readOnly"
        placeholder="列表页展示的摘要，留空则不写"
      />
      <p class="sd-hint">{{ summary.length }}/500</p>
    </div>

    <div class="border-t border-border pt-6">
      <p class="mb-2 font-mono text-xs uppercase tracking-[0.08em] text-dim">封面</p>
      <CoverField v-model="coverUrl" :disabled="readOnly" />
      <!-- 自动封面提示：未手动选图时保存会自动取正文首图 -->
      <!-- 同样在卡片内，落回 --bg 与卡片拉开一档 -->
      <div v-if="autoCover" class="mt-2.5 flex items-center gap-2.5 border border-border bg-bg p-2.5">
        <img :src="autoCover" alt="正文首图" class="h-12 w-16 shrink-0 rounded-sm object-cover" />
        <div class="min-w-0 flex-1">
          <p class="text-xs">未设置封面，保存时将自动取正文首图</p>
          <button
            class="mt-0.5 text-xs text-primary-fg hover:underline disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="readOnly"
            @click="adoptAutoCover"
          >
            立即采用为封面
          </button>
        </div>
      </div>
    </div>

    <!-- 额外区块（发布信息、历史版本等由调用方注入） -->
    <slot />
  </div>
</template>
