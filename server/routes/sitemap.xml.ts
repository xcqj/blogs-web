// S17 sitemap 索引：/sitemap.xml（sitemapindex 协议）。
// 策略（ROADMAP S17 / plan §2.16）：查后端公共列表拿 total 计算块数，分块文件 /sitemap/{n}.xml
// 每块 500 篇；2 万演示数据 → 41 块，面试数据清理后自然收缩。全文含 lastmod。
// 服务端 defineCachedEventHandler 10 分钟：41 块按需生成不重复打后端；爬虫侧另有 Cache-Control 头。
// seoFeed 工具（SITEMAP_CHUNK_SIZE/escapeXml/toW3CDate）与 blogGet 同走 Nitro server/utils 自动导入。

export default defineCachedEventHandler(
  async (event) => {
    const { public: pub } = useRuntimeConfig(event)
    const siteUrl = String(pub.siteUrl || '').replace(/\/+$/, '')

    // pageSize=1 只取 total 与最新一篇的发布时间（块级 lastmod 的合理近似，避免 N+1 次查询）
    const { rows, total } = await blogGet<{ rows: any[]; total: number }>(event, '/blog/public/articles', {
      pageNum: 1,
      pageSize: 1
    })
    const latest = rows?.[0]?.publishedAt ? toW3CDate(rows[0].publishedAt) : toW3CDate('1970-01-01 00:00:00')

    const chunkCount = Math.max(0, Math.ceil(Number(total || 0) / SITEMAP_CHUNK_SIZE))
    const children = Array.from({ length: chunkCount }, (_, n) =>
      `  <sitemap>\n    <loc>${escapeXml(`${siteUrl}/sitemap/${n}.xml`)}</loc>\n    <lastmod>${latest}</lastmod>\n  </sitemap>`
    ).join('\n')

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=600')
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children}
</sitemapindex>
`
  },
  { maxAge: 600, name: 'sitemapIndex', swr: true }
)
