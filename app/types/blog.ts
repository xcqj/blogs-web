// blog-web 前台数据类型，字段对齐 ../RuoYi-Vue-Plus/docs/blog-api.md 与后端实际返回。
// 注意：ID 后端序列化为字符串（雪花 ID 超出 JS 安全整数），一律按 string 处理，不做数值运算。

/** §5.1 公共文章列表项 / §5.2 详情摘要视图 */
export interface ArticleSummary {
  articleId: string
  title: string
  summary: string
  coverUrl: string
  authorId: string
  authorName: string
  publishedAt: string
  viewCount: number
  tags: TagRef[]
}

/** 标签最小引用（列表内嵌 tags 用） */
export interface TagRef {
  tagId: string
  name: string
  slug: string
}

/** §7.1 精选 / §7.2 热门标签项 */
export interface TagItem {
  tagId: string
  name: string
  slug: string
  articleCount: number | null
}

/** RuoYi 统一分页返回（字段名固定 rows/total，契约 §2.2） */
export interface PageResult<T> {
  rows: T[]
  total: number
}

/** RuoYi 统一响应 envelope（契约 §2.3） */
export interface ApiEnvelope<T> {
  code: number
  msg: string
  data: T
}

/** §5.2 当前生效版本（title/summary/coverUrl/content 物理在版本表） */
export interface ArticleVersion {
  versionId: string
  articleId: string
  versionNo: number
  title: string
  summary: string
  coverUrl: string
  content: string
  createBy: string
  createTime: string
}

/** §5.2 公共文章详情（BlogPublicArticleDetailVo，不含 status/visibility/治理字段） */
export interface ArticleDetail {
  articleId: string
  authorId: string
  authorName: string
  currentVersion: ArticleVersion
  publishedAt: string
  tags: TagRef[]
  viewCount: number
}

/** §10.1 一级评论项（userName 由后端 USER_ID_TO_NAME 翻译，不复制） */
export interface Comment {
  commentId: string
  articleId: string
  userId: string
  userName: string
  content: string
  createTime: string
}
