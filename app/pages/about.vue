<script setup lang="ts">
// /about —— 站点自我介绍（S27）。
// 内容写成「长期成立的事实」，不放会根据时间过期的表述（如"最近在做什么"）。
useSeoMeta({
  title: '关于本站',
  description: 'Stack Depth 是一个多作者技术博客，专注把技术问题讲透：遇到了什么、怎么定位、为什么这样解。',
  ogTitle: '关于本站',
  ogDescription: 'Stack Depth 是一个多作者技术博客，专注把技术问题讲透。',
  ogType: 'website'
})
</script>

<template>
  <!-- 文字型页面：整页按 66ch 居中，与详情页口径一致（全宽 1180 会让行长过长、不便阅读） -->
  <div class="sd-measure mx-auto space-y-10">
    <SectionMark index="06" title="ABOUT" />

    <header>
      <h1 class="font-serif text-2xl font-bold tracking-[var(--ls-h1)] md:text-3xl">关于本站</h1>
      <p class="mt-3 max-w-[46ch] text-sm leading-relaxed text-muted">
        一个把「踩过的坑」写下来的地方。
      </p>
    </header>

    <div class="prose sd-measure">
      <h2>这个站在做什么</h2>
      <p>
        Stack Depth 是一个多作者技术博客。这里不收教程式的转述——每篇文章都要求写清楚三件事：
        <strong>遇到了什么问题</strong>、<strong>怎么定位到的</strong>、<strong>为什么选择这个解法</strong>。
        只写自己验证过的结论，不确定的地方会明确标出来。
      </p>

      <h2>谁在写</h2>
      <p>
        目前有五位常驻作者，方向覆盖后端与分布式、数据库与存储、前端与工程化、运维与云原生。
        每篇文章顶部都能看到作者，点击头像可以查看 ta 的全部公开文章。
      </p>

      <h2>写了什么</h2>
      <ul>
        <li><strong>后端</strong>：Spring Boot 自动配置、JVM 内存与调优、并发与锁</li>
        <li><strong>数据</strong>：MySQL 索引与执行计划、事务隔离、Redis 缓存策略</li>
        <li><strong>前端</strong>：Vue 3 响应式、TypeScript 类型设计、构建与性能</li>
        <li><strong>运维</strong>：Docker 镜像瘦身、Nginx 反代、Linux 内存排查</li>
      </ul>
      <p>
        也可以在 <NuxtLink to="/tags">标签索引</NuxtLink> 里按主题浏览，或用 <NuxtLink to="/search">搜索</NuxtLink>
        直接找关键词——搜索会同时匹配标题与摘要。
      </p>

      <h2>怎么做的</h2>
      <p>
        前台是 Nuxt 4 的服务端渲染应用，服务端基于 RuoYi-Vue-Plus，搭配 MySQL、Redis、MinIO 与 Elasticsearch。
        这套组合的取舍很实际：SSR 保证首屏与搜索引擎可见性；ES 挂了会自动降级成 MySQL 的 LIKE 查询，
        站点不会因为搜索组件故障而不可用。
      </p>
      <p>
        文章支持富文本排版、代码语法高亮（服务端解析，读者端零额外脚本）、深浅主题切换，
        以及装到桌面后的离线阅读。
      </p>

      <h2>联系与订阅</h2>
      <p>
        不想每次手动来看，可以订阅 <a href="/rss.xml">RSS</a>，新文章发布即更新。
        发现内容有误，欢迎在文章下方留言指出——作者会看到，也会改。
      </p>
    </div>
  </div>
</template>
