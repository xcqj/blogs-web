<script setup lang="ts">
// /me/{id}/edit —— 编辑文章（S12，§3.3 取详情 + §3.4 保存）。整页 ssr:false（含 WangEditor）。
definePageMeta({ ssr: false });
useRequireAuth();

const route = useRoute();
const articleId = computed(() => String(route.params.id || ''));

useSeoMeta({
  title: () => `编辑文章 · 作者中心`,
  robots: 'noindex,follow'
});
</script>

<template>
  <ArticleForm :article-id="articleId" />
</template>
