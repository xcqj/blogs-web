<script setup lang="ts">
// 作者中心入口占位（D29/S12）。本轮桶A 只做全站 shell 的「登录态才显示作者中心」，
// 我的文章列表 / WangEditor 编辑页 / 发布·隐藏·删除动作属后续独立切片 S12，故此处仅占位不留死链。
definePageMeta({ layout: 'default' })
useSeoMeta({ title: '作者中心' })
</script>

<template>
  <section class="sd-card p-8 text-center">
    <span class="i-mdi:rocket-launch-outline mx-auto block text-4xl text-primary" aria-hidden="true" />
    <h1 class="mt-3 text-2xl font-semibold">作者中心</h1>
    <p class="mt-2 text-sm text-muted">发文 / 编辑 / 发布与隐藏等自助能力将在 S12 切片落地，当前为入口占位。</p>
    <NuxtLink to="/" class="btn-primary mt-6 inline-flex">返回阅读</NuxtLink>
  </section>
</template>
