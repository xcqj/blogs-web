import type { ArticleVersion, TagRef } from './blog';

// 作者中心（S12 / D29）类型，字段对齐后端 BlogArticle*Vo / BlogArticleSaveBo / BlogArticleMyQueryBo。
// ID 一律 string（后端雪花 ID 序列化为字符串）。

/** 契约 §3：status 0=DRAFT、1=PUBLISHED */
export type BlogStatus = '0' | '1';

/** 契约 §3：visibility 0=PUBLIC、1=USER_HIDDEN、2=ADMIN_HIDDEN */
export type BlogVisibility = '0' | '1' | '2';

/** §3.2 我的文章列表行（BlogArticleListItemVo） */
export interface AuthorArticle {
  articleId: string;
  authorId: string;
  authorName: string;
  status: BlogStatus;
  visibility: BlogVisibility;
  title: string;
  summary: string | null;
  coverUrl: string | null;
  viewCount: number;
  publishedAt: string | null;
  updateTime: string | null;
  tags: TagRef[];
}

/** §3.3 我的文章详情（BlogArticleDetailVo，含管理员治理字段） */
export interface AuthorArticleDetail {
  articleId: string;
  authorId: string;
  authorName: string;
  slug: string | null;
  status: BlogStatus;
  visibility: BlogVisibility;
  viewCount: number;
  publishedAt: string | null;
  adminHiddenReason: string | null;
  adminHiddenBy: string | null;
  adminHiddenByName: string | null;
  adminHiddenTime: string | null;
  createTime: string;
  updateTime: string;
  currentVersion: ArticleVersion;
  tags: TagRef[];
}

/** §4.1 版本列表项（SdBlogArticleVersionVo 精简视图） */
export interface ArticleVersionMeta {
  versionId: string;
  articleId: string;
  versionNo: number;
  title: string;
  createBy: string;
  createTime: string;
}

/** §3.1 / §3.4 保存载荷（BlogArticleSaveBo）：无 slug、无定时发布（§2.8 锁定） */
export interface ArticleSavePayload {
  title: string;
  summary?: string;
  coverUrl?: string;
  content: string;
  /** 标签名集合，1~6 个；新标签后端自动入库 */
  tagNames: string[];
}

/** OSS 上传返回（/resource/oss/upload） */
export interface OssUploadResult {
  ossId: string;
  url: string;
  fileName: string;
}
