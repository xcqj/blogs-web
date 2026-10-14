// S17 sitemap 分块：/sitemap/{n}.xml（n 从 0 起，块大小见 seoFeed.SITEMAP_CHUNK_SIZE=500）。
// 每条 <url> = loc（/post/{articleId}，契约 §1.4 slug 承载 articleId）+ lastmod（W3C datetime）。
// 数据源 = 后端公共列表（公共可见三条件由后端强制过滤，前台不拼可见性——AGENTS.md 红线）。
// seoFeed 工具与 blogGet 同走 Nitro server/utils 自动导入。

export default defineCachedEventHandler(
  async (event) => {
    const { public: pub } = useRuntimeConfig(event)
    const siteUrl = String(pub.siteUrl || '').replace(/\/+$/, '')
    const chunk = Math.max(0, Number(getRouterParam(event, 'n')) || 0)

    const { rows } = await blogGet<{ rows: any[] }>(event, '/blog/public/articles', {
      pageNum: chunk + 1,
      pageSize: SITEMAP_CHUNK_SIZE
    })

    const urls = (rows || [])
      .map(
        (a) =>
          `  <url>\n    <loc>${escapeXml(`${siteUrl}/post/${a.articleId}`)}</loc>\n    <lastmod>${toW3CDate(a.publishedAt)}</lastmod>\n  </url>`
      )
      .join('\n')

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=600')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  },
  { maxAge: 600, name: 'sitemapChunk', swr: true }
)
