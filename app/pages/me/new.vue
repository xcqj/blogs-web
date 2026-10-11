<script setup lang="ts">
// /me/new —— 新建文章（S12）。作者中心 CSR 为主：整页 ssr:false，WangEditor 不进服务端渲染。
definePageMeta({ ssr: false });
useRequireAuth();
useSeoMeta({ title: '新建文章 · 作者中心', robots: 'noindex,follow' });
</script>

<template>
  <ArticleForm />
</template>
