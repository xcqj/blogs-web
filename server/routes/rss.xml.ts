// S17 RSS 2.0 订阅源：/rss.xml，最新 N 篇公共文章（N = RSS_LATEST_SIZE=20）。
// 数据源 = 后端公共列表（published_at DESC 默认排序，pageSize=N 即最新 N 篇）；零后端改动。
// 每个 item：title / link / guid(isPermaLink) / pubDate(RFC 822) / description(摘要，escapeXml)。
export default defineCachedEventHandler(
  async (event) => {
    const { public: pub } = useRuntimeConfig(event)
    const siteUrl = String(pub.siteUrl || '').replace(/\/+$/, '')
    const siteName = String(pub.siteName || 'Stack Depth')

    const { rows } = await blogGet<{ rows: any[] }>(event, '/blog/public/articles', {
      pageNum: 1,
      pageSize: RSS_LATEST_SIZE
    })

    const items = (rows || [])
      .map((a) => {
        const link = `${siteUrl}/post/${a.articleId}`
        return `    <item>
      <title>${escapeXml(a.title || '')}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${toRssDate(a.publishedAt)}</pubDate>
      <description>${escapeXml(a.summary || '')}</description>
    </item>`
      })
      .join('\n')

    setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=1800')
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}/</link>
    <description>${escapeXml(`${siteName} 最新文章`)}</description>
    <language>zh-CN</language>
    <atom:link href="${escapeXml(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  },
  { maxAge: 1800, name: 'rssFeed', swr: true }
)
