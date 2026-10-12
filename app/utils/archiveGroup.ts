// 文章列表按发布年月归档分组（jason.blog 归档语义；首页与 /page/{n} 左栏共用）。
// 纯函数：输入后端 §5.1 rows（publishedAt 形如 "yyyy-MM-dd HH:mm:ss"，已按发布时间倒序），
// 按 "yyyy-MM" 顺序分组、组内保持既有顺序；只对当前页数据分组，不跨页聚合。
import type { ArticleSummary } from '~/types/blog'

export interface ArchiveGroup {
  /** 分组键 "2026-10"（publishedAt 前 7 位） */
  key: string
  /** 组头展示文本 "2026 · 10" */
  label: string
  items: ArticleSummary[]
}

export function groupByMonth(rows: ArticleSummary[]): ArchiveGroup[] {
  const groups: ArchiveGroup[] = []
  for (const row of rows) {
    const key = (row.publishedAt || '').slice(0, 7)
    const label = key.length === 7 ? `${key.slice(0, 4)} · ${key.slice(5, 7)}` : '更早'
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(row)
    } else {
      groups.push({ key, label, items: [row] })
    }
  }
  return groups
}
