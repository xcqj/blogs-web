#!/usr/bin/env node
// =============================================================================
// 演示数据种子生成器（S26）
//
// 为什么要有生成器而不是手写 SQL：
//   演示场景下代码块必须带高亮，而高亮 class 是 shiki 生成的 hash（tok-1itgoe），手写不现实。
//   所以走「定义内容 → 跑一次 shiki → 输出 SQL」，产物是静态 SQL 文件，后端仓自包含。
//
// 跑法：
//   node tooling/gen-demo-seed.mjs          # 生成 seed-min.sql + seed-demo.sql
//   node tooling/gen-demo-seed.mjs --check  # 只打印规模，不写文件
//
// 依赖：复用 app/utils/highlight.ts（S24 的 highlightCodeBlocks），零新增依赖。
//       Node 24 可直接 import .ts（type stripping）。
// =============================================================================

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { highlightCodeBlocks } from '../app/utils/highlight.ts'
import { AUTHORS, TAGS, COVERS, POSTS_MIN } from './seed/data-min.mjs'
import { POSTS_DEMO_EXTRA } from './seed/data-demo.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(HERE, '../../RuoYi-Vue-Plus/script/sql/seed')
const CHECK_ONLY = process.argv.includes('--check')

// ---------------------------------------------------------------------------
// ID 段：22xx 段完全空闲（现有雪花 ID 是 21xx、框架 ID 是 17xx）
// 用 BigInt 拼接——19 位数字超出 Number.MAX_SAFE_INTEGER，用 number 会丢精度
// ---------------------------------------------------------------------------
const SEG = {
  user: 2210000000000000000n,
  tag: 2220000000000000000n,
  article: 2230000000000000000n,
  version: 2240000000000000000n,
  comment: 2250000000000000000n,
  relation: 2260000000000000000n
}
const uid = (seq) => (SEG.user + BigInt(seq)).toString()
const tid = (seq) => (SEG.tag + BigInt(seq)).toString()
const aid = (seq) => (SEG.article + BigInt(seq)).toString()
const vid = (seq) => (SEG.version + BigInt(seq)).toString()
const cid = (seq) => (SEG.comment + BigInt(seq)).toString()
const rid = (seq) => (SEG.relation + BigInt(seq)).toString()

/** admin 的 BCrypt（admin123），复用现成 hash，避免自造不兼容 */
const PASSWORD_HASH = '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2'

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

const NOW = Date.now()
/** 相对今天往前 n 天的某个时刻（基准取运行日，所以每次重新生成的"最近 90 天"始终新鲜） */
function daysAgo(n, hour = 10, minute = 24) {
  const d = new Date(NOW - n * 86400000)
  d.setHours(hour, minute, 0, 0)
  return fmt(d)
}
function hoursAfter(baseStr, hours) {
  const d = new Date(baseStr.replace(' ', 'T'))
  return fmt(new Date(d.getTime() + hours * 3600000))
}

/** SQL 字面量：先转反斜杠再转单引号（MySQL 默认模式反斜杠是转义符） */
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "''")
const q = (v) => (v === null || v === undefined ? 'NULL' : `'${esc(v)}'`)

// ---------------------------------------------------------------------------
// 评论文案池：真实语气，不是「好评」「支持」这类无信息量的话
// ---------------------------------------------------------------------------
const COMMENT_TEXTS = [
  '这篇的排查路径写得很清楚，尤其是先看 EXPLAIN 而不是直接加索引那段，吃过亏。',
  '补充一点：我们线上也遇到过，最后定位到是统计信息过期，ANALYZE TABLE 之后就恢复了。',
  '看完去翻了下我们的慢日志，确实有一条跟文里一模一样，回头就改。',
  '「先确定 LCP 元素是什么，再决定砍什么」这句说到点子上了，之前优化方向一直是错的。',
  '请问这个结论在不同版本上验证过吗？我们用的版本比较老，行为好像不太一样。',
  '写得很克制，没有堆术语。收藏了。',
  '第三点我持保留意见，理论上可行，但实际项目里改造成本比收益高。',
  '正好在排查类似问题，按这个思路试了一下，确实定位到了。谢谢。',
  '这个坑我也踩过，当时的解法更土一点，直接加机器绕过去了，现在知道根因了。',
  '希望能再展开讲讲失败回滚那部分，这块一直没想清楚。',
  '文里的示例代码可以直接跑，这点很难得。',
  '对照着改了一版，指标确实有改善，不过幅度没有文里说的大，可能跟我们数据量有关。',
  '有个细节想确认：这里说的超时是连接超时还是读取超时？两者表现差别挺大的。',
  '看标题以为是水文，点进来发现是真踩过的，收藏。',
  '「把个人偏好标成必须改是评审最常见的摩擦源」——这句值得贴在墙上。',
  '之前一直以为这个问题只能靠加缓存解决，原来是索引的问题。',
  '这类文章最有价值的地方是给了判断依据，而不是给了一个标准答案。',
  '补充一个边界：并发很高的时候这个方案会退化成串行，要注意。',
  '读完去改了自己的配置，确实少了一堆无效告警。',
  '能不能出个续篇，讲讲线上灰度怎么配合这块？'
]

/** 评论者：只用种子作者，保证不依赖库里其他用户 */
const COMMENTER_SEQS = [1, 2, 3, 4, 5]

// ---------------------------------------------------------------------------
// 组装一份种子
// ---------------------------------------------------------------------------
async function buildSeed({ label, authors, tags, posts, commentTarget }) {
  const lines = []
  const push = (s = '') => lines.push(s)

  push('-- ' + '='.repeat(75))
  push(`-- ${label}（由 blog-web/tooling/gen-demo-seed.mjs 生成，勿手改）`)
  push('--')
  push(`-- 规模：${authors.length} 位作者 / ${tags.length} 个标签 / ${posts.length} 篇文章 / ${commentTarget} 条评论`)
  push(`-- 生成日期：${fmt(new Date(NOW))}`)
  push('--')
  push('-- 幂等：执行前先删除 22xx 段内的旧种子数据，可反复装载；不触碰框架 ID（17xx）与真实数据（21xx）。')
  push('-- 装载：docker compose --profile seed run --rm seed')
  push('-- ' + '='.repeat(75))
  push()
  push('SET NAMES utf8mb4;')
  push('START TRANSACTION;')
  push()
  push('-- ---------- 清理旧种子（先子表后父表）----------')
  push(`DELETE FROM sd_blog_comment       WHERE comment_id      >= 2250000000000000000 AND comment_id      < 2260000000000000000;`)
  push(`DELETE FROM sd_blog_article_tag   WHERE article_tag_id  >= 2260000000000000000 AND article_tag_id  < 2270000000000000000;`)
  push(`DELETE FROM sd_blog_article_version WHERE version_id    >= 2240000000000000000 AND version_id      < 2250000000000000000;`)
  push(`DELETE FROM sd_blog_article       WHERE article_id      >= 2230000000000000000 AND article_id      < 2240000000000000000;`)
  push(`DELETE FROM sd_blog_tag_alias     WHERE tag_id          >= 2220000000000000000 AND tag_id          < 2230000000000000000;`)
  push(`DELETE FROM sd_blog_tag           WHERE tag_id          >= 2220000000000000000 AND tag_id          < 2230000000000000000;`)
  push(`DELETE FROM sd_blog_user_profile  WHERE user_id         >= 2210000000000000000 AND user_id         < 2220000000000000000;`)
  push(`DELETE FROM sys_user_role         WHERE user_id         >= 2210000000000000000 AND user_id         < 2220000000000000000;`)
  push(`DELETE FROM sys_user              WHERE user_id         >= 2210000000000000000 AND user_id         < 2220000000000000000;`)
  push()
  // 标签 slug 是唯一键：库里已有同名的旧标签（如开发期建的 Java）会让整个事务回滚。
  // 演示场景下旧标签本就该被替换，故先删同名标签连同其文章关系（只删 22 段外的，不碰别的）。
  const tagNames = tags.map((t) => `'${t.name.replace(/'/g, "''")}'`).join(', ')
  push('-- 顶掉同名的旧标签（slug 唯一键冲突），连同它们的文章关系一并清理')
  push(`DELETE FROM sd_blog_article_tag WHERE tag_id IN (SELECT tag_id FROM (SELECT tag_id FROM sd_blog_tag WHERE name IN (${tagNames}) AND tag_id < 2220000000000000000) t);`)
  push(`DELETE FROM sd_blog_tag_alias  WHERE tag_id IN (SELECT tag_id FROM (SELECT tag_id FROM sd_blog_tag WHERE name IN (${tagNames}) AND tag_id < 2220000000000000000) u);`)
  push(`DELETE FROM sd_blog_tag        WHERE name IN (${tagNames}) AND tag_id < 2220000000000000000;`)
  push()

  // ---------- 用户 ----------
  push('-- ---------- 作者（密码统一为 admin123，仅演示用）----------')
  for (const a of authors) {
    const id = uid(a.seq)
    const ct = daysAgo(95)
    push(
      `INSERT INTO sys_user (user_id, dept_id, user_name, nick_name, user_type, email, phone_number, gender, avatar, password, status, del_flag, login_ip, login_date, create_dept, create_by, create_time, update_by, update_time, remark) VALUES ` +
        `(${id}, 1761000000000000103, ${q(a.name)}, ${q(a.nick)}, 'sys_user', ${q(a.email)}, '', '0', NULL, ${q(PASSWORD_HASH)}, '0', '0', '127.0.0.1', ${q(ct)}, 1761000000000000103, 1761100000000000001, ${q(ct)}, 1761100000000000001, ${q(ct)}, '演示数据');`
    )
    push(
      `INSERT INTO sd_blog_user_profile (user_id, bio, create_dept, create_by, create_time, update_by, update_time, del_flag) VALUES ` +
        `(${id}, ${q(a.bio)}, 1761000000000000103, 1761100000000000001, ${q(ct)}, 1761100000000000001, ${q(ct)}, '0');`
    )
  }
  push()

  // ---------- 标签 ----------
  push('-- ---------- 标签（前 3 个设为精选，形成首页标签云的视觉重心）----------')
  tags.forEach((t, i) => {
    const featured = i < 3 ? '1' : '0'
    const sort = i < 3 ? String(i + 1) : '0'
    const ct = daysAgo(93)
    push(
      `INSERT INTO sd_blog_tag (tag_id, name, slug, status, merged_into, is_featured, sort_order, create_dept, create_by, create_time, update_by, update_time, del_flag) VALUES ` +
        `(${tid(t.seq)}, ${q(t.name)}, ${q(t.slug)}, '0', NULL, ${q(featured)}, ${sort}, 1761000000000000103, 1761100000000000001, ${q(ct)}, 1761100000000000001, ${q(ct)}, '0');`
    )
  })
  push()

  // ---------- 文章 + 版本 + 关系 ----------
  push('-- ---------- 文章与版本（成对插入；current_version_id 指向同批次版本）----------')
  let relSeq = 1
  const articleTimes = []
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const seq = i + 1
    const articleId = aid(seq)
    const versionId = vid(seq)
    const authorId = uid(post.authorSeq)
    const publishAt = daysAgo(post.daysAgo, 9 + (i % 8), (i * 7) % 60)
    const createAt = post.status === '1' ? hoursAfter(publishAt, -3) : daysAgo(post.daysAgo, 9, 0)
    articleTimes.push(publishAt)

    // 正文跑一遍 shiki（失败回落原文，绝不中断生成）
    const content = await highlightCodeBlocks(post.html)

    const coverUrl = post.cover === null || post.cover === undefined ? null : COVERS[post.cover]
    const hiddenBy = post.visibility === '2' ? '1761100000000000001' : null
    const hiddenAt = post.visibility === '2' ? daysAgo(Math.max(0, post.daysAgo - 2), 15, 30) : null

    push(
      `INSERT INTO sd_blog_article (article_id, author_id, slug, status, visibility, current_version_id, view_count, published_at, admin_hidden_reason, admin_hidden_by, admin_hidden_time, create_dept, create_by, create_time, update_by, update_time, del_flag) VALUES ` +
        `(${articleId}, ${authorId}, NULL, ${q(post.status)}, ${q(post.visibility)}, ${versionId}, ${post.views}, ${post.status === '1' ? q(publishAt) : 'NULL'}, ` +
        `${q(post.hiddenReason || null)}, ${hiddenBy ?? 'NULL'}, ${hiddenAt ? q(hiddenAt) : 'NULL'}, 1761000000000000103, ${authorId}, ${q(createAt)}, ${authorId}, ${q(createAt)}, '0');`
    )
    push(
      `INSERT INTO sd_blog_article_version (version_id, article_id, version_no, title, summary, cover_url, content, create_dept, create_by, create_time, update_by, update_time, del_flag) VALUES ` +
        `(${versionId}, ${articleId}, 1, ${q(post.title)}, ${q(post.summary)}, ${q(coverUrl)}, ${q(content)}, 1761000000000000103, ${authorId}, ${q(createAt)}, ${authorId}, ${q(createAt)}, '0');`
    )

    for (const tagSeq of post.tagSeqs) {
      push(
        `INSERT INTO sd_blog_article_tag (article_tag_id, article_id, tag_id, create_dept, create_by, create_time, update_by, update_time) VALUES ` +
          `(${rid(relSeq++)}, ${articleId}, ${tid(tagSeq)}, 1761000000000000103, ${authorId}, ${q(createAt)}, ${authorId}, ${q(createAt)});`
      )
    }
  }
  push()

  // ---------- 评论 ----------
  push('-- ---------- 评论（只挂在已发布且公开的文章上；时间晚于文章发布）----------')
  // 找出可评论的文章：已发布 + 公开
  const commentable = posts
    .map((post, i) => ({ post, seq: i + 1, publishedAt: articleTimes[i] }))
    .filter((x) => x.post.status === '1' && x.post.visibility !== '2')

  for (let i = 0; i < commentTarget; i++) {
    const target = commentable[i % commentable.length]
    const text = COMMENT_TEXTS[i % COMMENT_TEXTS.length]
    // 评论时间：发布后 2 小时 ~ 20 天，保证不早于文章
    const offsetHours = 2 + ((i * 37) % (20 * 24))
    const ct = hoursAfter(target.publishedAt, offsetHours)
    const commenterId = uid(COMMENTER_SEQS[(i + target.seq) % COMMENTER_SEQS.length])
    push(
      `INSERT INTO sd_blog_comment (comment_id, article_id, user_id, parent_id, content, create_dept, create_by, create_time, update_by, update_time, del_flag) VALUES ` +
        `(${cid(i + 1)}, ${aid(target.seq)}, ${commenterId}, NULL, ${q(text)}, 1761000000000000103, ${commenterId}, ${q(ct)}, ${commenterId}, ${q(ct)}, '0');`
    )
  }
  push()
  push('COMMIT;')
  push()
  push(`-- 校验：`)
  push(`--   SELECT COUNT(*) FROM sd_blog_article WHERE article_id >= 2230000000000000000 AND article_id < 2240000000000000000;`)
  push(`--   SELECT COUNT(*) FROM sd_blog_article_version WHERE content LIKE '%class="tok-%';`)
  push()

  return { sql: lines.join('\n'), stats: { authors: authors.length, tags: tags.length, posts: posts.length, comments: commentTarget } }
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
const minSeed = await buildSeed({
  label: 'seed-min · 本地开发最小集',
  authors: AUTHORS.slice(0, 3),
  tags: TAGS.slice(0, 10),
  posts: POSTS_MIN,
  commentTarget: 30
})

const allPosts = POSTS_MIN.concat(POSTS_DEMO_EXTRA)
const demoSeed = await buildSeed({
  label: 'seed-demo · 演示 / 面试用',
  authors: AUTHORS,
  tags: TAGS,
  posts: allPosts,
  commentTarget: 200
})

if (CHECK_ONLY) {
  console.log('min :', JSON.stringify(minSeed.stats), '| SQL', (minSeed.sql.length / 1024).toFixed(0) + 'KB')
  console.log('demo:', JSON.stringify(demoSeed.stats), '| SQL', (demoSeed.sql.length / 1024).toFixed(0) + 'KB')
  const tokCount = (demoSeed.sql.match(/class="tok-/g) || []).length
  console.log('demo 里的 tok span 片段数:', tokCount)
} else {
  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(resolve(OUT_DIR, 'seed-min.sql'), minSeed.sql, 'utf8')
  writeFileSync(resolve(OUT_DIR, 'seed-demo.sql'), demoSeed.sql, 'utf8')
  console.log('已生成：')
  console.log('  seed-min.sql  ', JSON.stringify(minSeed.stats), (minSeed.sql.length / 1024).toFixed(0) + 'KB')
  console.log('  seed-demo.sql ', JSON.stringify(demoSeed.stats), (demoSeed.sql.length / 1024).toFixed(0) + 'KB')
}
