<script setup lang="ts">
// /me/profile —— 个人资料（S12，design/profile.html 基线；契约 §8.1/§8.2）。
// 只有 bio 可改；头像与昵称实时取自 sys_user（§9.1 不复制），改头像属 RuoYi 用户中心
// （/system/user/** 超出 blog-web 允许的 API 层，红线，故此处不提供入口，仅提示）。
import type { BlogUserProfile } from '~/types/author';

const { logged, ready } = useRequireAuth();

const { data: prof, status } = await useAsyncData(
  'my-profile',
  () => (logged.value ? $fetch<BlogUserProfile>('/api/blog/user/profile') : Promise.resolve(null)),
  { watch: [logged] }
);

const bio = ref('');
const loaded = ref(false);
watch(prof, (p) => {
  if (p && !loaded.value) {
    bio.value = p.bio ?? '';
    loaded.value = true;
  }
});

const saving = ref(false);
const notice = ref('');
const error = ref('');

async function save() {
  if (saving.value) return;
  saving.value = true;
  notice.value = '';
  error.value = '';
  try {
    await $fetch('/api/blog/user/profile', { method: 'PUT', body: { bio: bio.value.trim() } });
    if (prof.value) prof.value.bio = bio.value.trim() || null;
    notice.value = '已保存';
  } catch (e: any) {
    error.value = apiErrorText(e, '保存失败');
  } finally {
    saving.value = false;
  }
}

function reset() {
  bio.value = prof.value?.bio ?? '';
  notice.value = '';
}

useSeoMeta({ title: '个人资料 · 作者中心', robots: 'noindex,follow' });
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <header class="mb-5">
      <h1 class="text-2xl font-semibold">个人资料</h1>
      <p class="mt-1 text-sm text-muted">走 §8 <code>GET/PUT /blog/user/profile</code>，仅个人简介可编辑</p>
    </header>

    <ErrorState v-if="ready && !logged" title="请先登录" description="个人资料需要登录后访问。">
      <NuxtLink to="/" class="btn-ghost">返回首页</NuxtLink>
    </ErrorState>

    <div v-else-if="status === 'pending'" class="sd-card h-64 animate-pulse" />

    <div v-else-if="prof" class="sd-card space-y-5 p-5">
      <!-- 头像 + 昵称：只读展示（来源 sys_user） -->
      <div class="flex flex-wrap items-center gap-4">
        <AppAvatar :name="prof.nickName" :src="prof.avatarUrl" size="lg" />
        <div class="min-w-0">
          <p class="text-base font-semibold">{{ prof.nickName }}</p>
          <p class="sd-hint">头像与昵称在 RuoYi 用户中心修改，此处只读展示（§9.1 不复制到博客表）</p>
        </div>
        <NuxtLink
          v-if="prof.userId"
          :to="`/user/${prof.userId}`"
          class="ml-auto text-sm text-primary hover:underline"
        >
          我的公开主页 →
        </NuxtLink>
      </div>

      <div class="sd-field">
        <label class="sd-label" for="bio">个人简介（bio）</label>
        <textarea
          id="bio"
          v-model="bio"
          rows="4"
          maxlength="500"
          class="sd-textarea"
          placeholder="一句话介绍你自己，会展示在公开主页与文章作者卡片"
        />
        <div class="flex items-center justify-between">
          <p class="sd-hint">最多 500 字；留空则不展示</p>
          <p class="sd-hint">{{ bio.length }}/500</p>
        </div>
      </div>

      <p v-if="notice" class="rounded-md bg-chip px-3 py-2 text-sm text-primary-strong">{{ notice }}</p>
      <p v-if="error" class="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{{ error }}</p>

      <div class="flex justify-end gap-2 border-t border-border pt-4">
        <button class="btn-ghost" :disabled="saving" @click="reset">取消</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存资料' }}</button>
      </div>
    </div>

    <ErrorState v-else title="资料加载失败" description="请稍后重试，或重新登录。">
      <NuxtLink to="/" class="btn-ghost">返回首页</NuxtLink>
    </ErrorState>
  </section>
</template>
