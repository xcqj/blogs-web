// S17 SEO 三件套共享工具：sitemap / rss / robots 路由共用。
// 数据源一律走后端 /blog/public/articles 公共列表（blogGet），零后端改动（ROADMAP S17）。
// 只在 server/ 运行；XML/TXT 输出统一经 escapeXml，lastmod 统一 W3C datetime。

/** sitemap 单块文章数。实测后端 pageSize=500 ≈ 94ms / 271KB，无压力；
 *  协议上限 5 万 URL/文件，2 万演示数据 → 41 块，演示数据清理后自然收缩为 1 块。 */
export const SITEMAP_CHUNK_SIZE = 500

/** RSS 最新文章条数（RSS 2.0 惯例 10~20，取 20）。 */
export const RSS_LATEST_SIZE = 20

/** XML 文本节点转义（& < > " ' 全转，属性/文本两用）。 */
export function escapeXml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * 后端 publishedAt（"yyyy-MM-dd HH:mm:ss"，服务器本地时间）→ W3C datetime（UTC ISO）。
 * 例："2026-10-14 16:50:18" → "2026-10-14T08:50:18.000Z"
 */
export function toW3CDate(publishedAt: string): string {
  const d = new Date(String(publishedAt ?? '').replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
}

/** publishedAt → RFC 822（RSS pubDate）。 */
export function toRssDate(publishedAt: string): string {
  const d = new Date(String(publishedAt ?? '').replace(' ', 'T'))
  return (Number.isNaN(d.getTime()) ? new Date(0) : d).toUTCString()
}
