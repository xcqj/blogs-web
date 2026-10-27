// =============================================================================
// 演示数据 · 作者 / 标签 / 封面 / 最小集 8 篇（S26）
//
// 这一组存在的意义是「本地开发能触发每个分支」，所以矩阵是刻意铺满的：
//   封面 3 有 / 5 无；代码块 4 有 / 4 无；标签 1~4 个；状态 已发布5 / 草稿1 / 隐藏1 / 下线1
// 内容都写成真实技术话题，避免一眼看出是假数据。
// =============================================================================

/** 5 位作者；min 只用前 3 位（id 是 22 段内的序号，生成器负责拼成完整 ID） */
export const AUTHORS = [
  {
    seq: 1,
    name: 'chenyu',
    nick: '陈屿',
    bio: '后端工程师，写分布式与 JVM。相信「先跑通再优化」，也相信大多数性能问题不在代码里。',
    email: 'chenyu@example.com'
  },
  {
    seq: 2,
    name: 'linshen',
    nick: '林深',
    bio: '做数据库与存储，日常和索引、执行计划、慢查询打交道。喜欢把 EXPLAIN 当成体检报告看。',
    email: 'linshen@example.com'
  },
  {
    seq: 3,
    name: 'suwan',
    nick: '苏晚',
    bio: '前端工程师，关注渲染性能与工程化。写博客是为了把踩过的坑留给下一个踩的人。',
    email: 'suwan@example.com'
  },
  {
    seq: 4,
    name: 'zhoumu',
    nick: '周牧',
    bio: '运维 / 云原生，管过三台服务器也管过三百台。对「一条命令起来」有执念。',
    email: 'zhoumu@example.com'
  },
  {
    seq: 5,
    name: 'hexi',
    nick: '何夕',
    bio: '偶尔写点东西，主要记录读源码时想明白的事。更新很慢，但每篇都自己验证过。',
    email: 'hexi@example.com'
  }
]

/** 20 个技术标签；min 用前 10 个 */
export const TAGS = [
  { seq: 1, name: 'Java', slug: 'java' },
  { seq: 2, name: 'Spring Boot', slug: 'spring-boot' },
  { seq: 3, name: 'MySQL', slug: 'mysql' },
  { seq: 4, name: 'Redis', slug: 'redis' },
  { seq: 5, name: 'Vue', slug: 'vue' },
  { seq: 6, name: 'TypeScript', slug: 'typescript' },
  { seq: 7, name: 'Docker', slug: 'docker' },
  { seq: 8, name: 'Elasticsearch', slug: 'elasticsearch' },
  { seq: 9, name: 'JVM', slug: 'jvm' },
  { seq: 10, name: '性能优化', slug: 'performance' },
  { seq: 11, name: '架构', slug: 'architecture' },
  { seq: 12, name: '前端工程', slug: 'frontend-engineering' },
  { seq: 13, name: 'Nginx', slug: 'nginx' },
  { seq: 14, name: 'Linux', slug: 'linux' },
  { seq: 15, name: 'Git', slug: 'git' },
  { seq: 16, name: '测试', slug: 'testing' },
  { seq: 17, name: '数据库', slug: 'database' },
  { seq: 18, name: '缓存', slug: 'cache' },
  { seq: 19, name: '微服务', slug: 'microservices' },
  { seq: 20, name: '网络', slug: 'network' }
]

/** 10 张可用的 MinIO 封面（实测 HTTP 200，端口已映射到宿主机） */
export const COVERS = [
  'http://127.0.0.1:9000/ruoyi/2026/09/30/1244374ebda34594ab6a220298f8c617.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/05/9ac5d3880f9742829bb6b2bb565ab7ed.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/05/a0d7253288d34e9492f52f9e88863b55.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/06/bdabc344a78544f693b56459c04ede45.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/08/c03f78e8acd9458894b03775ba998b5e.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/09/8e666e85dffe4c4dbe7b106c5170bfb6.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/27/76bc03f6ec78479294db7e8aed5e16c9.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/27/89ace1ded77946f89b16e67857593822.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/27/b8000d2667af49a28ed193eee931986a.jpg',
  'http://127.0.0.1:9000/ruoyi/2026/10/27/6e30bd7413b3456b88c1a2ab73320ccd.jpg'
]

/** 正文构造器：h2 小节 + 段落 + 代码块 + 引用，避免手写几百行标签 */
export const h2 = (t) => `<h2>${t}</h2>`
export const p = (...ps) => ps.map((x) => `<p>${x}</p>`).join('')
export const ul = (...lis) => `<ul>${lis.map((x) => `<li>${x}</li>`).join('')}</ul>`
export const pre = (lang, src) => `<pre><code class="language-${lang}">${src}</code></pre>`
export const quote = (t) => `<blockquote><p>${t}</p></blockquote>`

/**
 * 最小集 8 篇。字段说明：
 *   authorSeq  对应 AUTHORS.seq
 *   tagSeqs    对应 TAGS.seq
 *   cover      是否带封面（索引 COVERS）
 *   status     '0' 草稿 / '1' 已发布
 *   visibility '0' 公开 / '1' 用户隐藏 / '2' 管理员下线
 *   daysAgo    相对今天的天数，生成器转成具体时间
 *   views      阅读量
 *   html       正文；代码块写 language-x，生成器负责跑 shiki
 */
export const POSTS_MIN = [
  {
    title: 'Spring Boot 自动配置到底是怎么生效的',
    summary: '从 @SpringBootApplication 拆到 AutoConfigurationImportSelector，再追到 spring.factories 与 AutoConfiguration.imports，把「引入依赖就能用」这件事讲透。',
    authorSeq: 1,
    tagSeqs: [1, 2],
    cover: 0,
    status: '1',
    visibility: '0',
    daysAgo: 86,
    views: 5120,
    html:
      h2('一个让人困惑的现象') +
      p(
        '加上 <code>spring-boot-starter-web</code> 依赖，什么都没配，Tomcat 就起来了、Jackson 就注册好了。这套「约定优于配置」的魔法入口，其实只有三个环节。'
      ) +
      h2('第一环：@SpringBootApplication 是三个注解的合成') +
      p('它等价于 <code>@SpringBootConfiguration</code>、<code>@EnableAutoConfiguration</code>、<code>@ComponentScan</code>。真正干活的是中间那个。') +
      pre(
        'java',
        `@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`
      ) +
      h2('第二环：@EnableAutoConfiguration 导入选择器') +
      p(
        '它通过 <code>@Import(AutoConfigurationImportSelector.class)</code> 把「候选配置类清单」交给容器。选择器不写死清单，而是去读 classpath 下的元数据文件。'
      ) +
      h2('第三环：元数据文件里的候选清单') +
      p(
        'Spring Boot 2.7 之前是 <code>META-INF/spring.factories</code>，之后迁到 <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>，一行一个全限定类名。'
      ) +
      quote('所以「引入依赖就能用」的本质是：依赖里带了元数据文件，文件里列了配置类，配置类上带条件注解。') +
      h2('条件注解才是真正的守门人') +
      p(
        '<code>@ConditionalOnClass</code>、<code>@ConditionalOnMissingBean</code> 这些决定了配置类会不会生效。排查「为什么我的自动配置没生效」时，打开 <code>--debug</code> 看 condition evaluation report 比读源码快得多。'
      )
  },
  {
    title: 'MySQL 索引失效的 8 种场景，附 EXPLAIN 对照',
    summary: '隐式类型转换、函数包裹列、前导通配符、OR 混合、联合索引最左前缀断裂……每种都给一条 SQL 和它的 EXPLAIN 结果。',
    authorSeq: 2,
    tagSeqs: [3, 17],
    cover: 1,
    status: '1',
    visibility: '0',
    daysAgo: 74,
    views: 4380,
    html:
      h2('先看一个反直觉的例子') +
      p('下面这条 SQL 建了索引却没用上，原因是列被函数包住了：') +
      pre('sql', `-- 建索引
CREATE INDEX idx_created ON orders (created_at);

-- 失效：函数包裹列
SELECT * FROM orders WHERE DATE(created_at) = '2026-09-01';

-- 改写后可用
SELECT * FROM orders
WHERE created_at >= '2026-09-01 00:00:00'
  AND created_at <  '2026-09-02 00:00:00';`) +
      h2('八种常见失效') +
      ul(
        '对索引列使用函数或表达式',
        '隐式类型转换（字符串列传数字，等价于给列套了 CAST）',
        '前导通配符 <code>LIKE \'%kw\'</code>',
        '联合索引不满足最左前缀',
        '范围查询之后的列无法用于排序与过滤',
        '<code>OR</code> 两侧有一侧无索引',
        '<code>!=</code>、<code>NOT IN</code> 导致全表扫描',
        '统计信息过期，优化器主动放弃索引'
      ) +
      h2('怎么确认') +
      p(
        '看 <code>EXPLAIN</code> 的 <code>type</code> 与 <code>key</code> 两列：<code>type=ALL</code> 是全表扫描，<code>key=NULL</code> 是压根没选索引。再配合 <code>rows</code> 估算行数判断代价。'
      ) +
      quote('索引不是加上就生效，它是「优化器认为划算」才会用。所以 EXPLAIN 是证据，不是猜测。')
  },
  {
    title: 'Redis 缓存穿透、击穿、雪崩：三种病与三张药方',
    summary: '名字很像，成因完全不同。把三者拆开讲清楚，再分别给布隆过滤器、互斥锁、过期时间打散的具体做法。',
    authorSeq: 1,
    tagSeqs: [4, 18, 11],
    cover: 2,
    status: '1',
    visibility: '0',
    daysAgo: 61,
    views: 3960,
    html:
      h2('三种故障的差别') +
      ul(
        '<strong>穿透</strong>：查一个数据库里也不存在的 key，缓存永远不命中',
        '<strong>击穿</strong>：某个热点 key 恰好过期，瞬间请求全打到数据库',
        '<strong>雪崩</strong>：大批 key 同一时刻过期，或 Redis 整体不可用'
      ) +
      h2('穿透：先挡掉不可能的请求') +
      p(
        '布隆过滤器能判断「这个 key 一定不存在」，把无效请求挡在缓存层之前。代价是存在极小的误判率，且不支持删除。'
      ) +
      pre('java', `if (!bloomFilter.mightContain(key)) {
    return null;   // 一定不存在，不查缓存也不查库
}
Object cached = redis.get(key);
if (cached != null) {
    return cached;
}
// 回源，即使查不到也缓存空值（短 TTL）
Object dbValue = repository.findById(key);
redis.set(key, dbValue == null ? EMPTY : dbValue, 60, TimeUnit.SECONDS);`) +
      h2('击穿：让一个请求去回源') +
      p(
        '对同一个 key 加互斥锁，只有一个线程回源，其余等待。注意锁要设超时，否则回源失败会一直阻塞。'
      ) +
      h2('雪崩：把过期时间打散') +
      p(
        '在基础 TTL 上加一个随机偏移，避免批量 key 同时失效。Redis 整体不可用则要靠降级（限流 + 本地缓存兜底），不是缓存层能解决的。'
      ) +
      quote('这三种问题的共同点是「缓存没帮上忙」。判断属于哪一种，看的是「没命中的原因」，而不是现象像不像。')
  },
  {
    title: 'Vue 3 响应式系统拆解：Proxy 与依赖收集',
    summary: '从 reactive() 到 effect()，把 track 与 trigger 两个过程走一遍，解释为什么 Vue 3 能精确到属性级别触发更新。',
    authorSeq: 3,
    tagSeqs: [5, 6],
    cover: 3,
    status: '1',
    visibility: '0',
    daysAgo: 48,
    views: 3410,
    html:
      h2('Vue 2 的 Object.defineProperty 撞到了什么墙') +
      p(
        '它只能劫持已存在的属性：新增属性要 <code>$set</code>，数组方法要重写，深层对象要递归遍历。Vue 3 换成 Proxy 后，这三个问题一起消失。'
      ) +
      pre(
        'javascript',
        `const state = reactive({ count: 0 });

effect(() => {
  console.log(state.count);   // 读取时 track
});

state.count++;                 // 写入时 trigger`
      ) +
      h2('依赖收集的容器长什么样') +
      p(
        '核心是三层 Map：<code>targetMap: WeakMap&lt;target, Map&lt;key, Set&lt;effect&gt;&gt;&gt;</code>。一个对象对应一组 key，一个 key 对应一组副作用函数。'
      ) +
      h2('为什么要用 WeakMap') +
      p(
        '键是对象，弱引用意味着对象被回收时对应的依赖表自动释放，不需要手动清理，也不会阻止垃圾回收。'
      ) +
      h2('computed 是惰性的 effect') +
      p(
        '它把自己的 getter 包成 effect，但加了 <code>dirty</code> 标记：依赖变化时只置脏不重算，真正读取时才求值。这就是「计算属性不会立即执行」的原因。'
      )
  },
  {
    title: 'Docker 多阶段构建：把镜像从 1.2GB 压到 90MB',
    summary: '一个真实的前后端镜像瘦身记录：分层缓存、alpine 基础镜像、只拷贝产物、合并 RUN 指令，每步都给出体积变化。',
    authorSeq: 4,
    tagSeqs: [7, 10],
    cover: 4,
    status: '1',
    visibility: '0',
    daysAgo: 33,
    views: 2870,
    html:
      h2('起点：一次天真的 Dockerfile') +
      // 用 bash 而不是 dockerfile：shiki 语言表里没有 dockerfile，会走"未知语言回落纯文本"，
      // 演示数据里少一篇高亮不划算；bash 对 FROM/RUN/COPY 这类指令的着色也够看
      pre(
        'bash',
        `FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", ".output/server/index.mjs"]`
      ) +
      p('镜像 1.2GB。原因很直白：<code>node_modules</code>、源码、构建缓存全留在镜像里。') +
      h2('第一刀：多阶段，运行层只带产物') +
      pre(
        'dockerfile',
        `FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
CMD ["node", ".output/server/index.mjs"]`
      ) +
      p('降到 210MB。') +
      h2('第二刀：依赖层单独一层') +
      p(
        '把 <code>COPY package*.json</code> 与 <code>npm ci</code> 提到源码之前。改业务代码时这一层命中缓存，不再重装依赖——构建时间从 3 分钟降到 20 秒。'
      ) +
      h2('第三刀：BUILDKIT 缓存挂载') +
      p(
        '包管理器的下载缓存可以挂在构建期而不进镜像层：<code>RUN --mount=type=cache,target=/root/.m2 mvn package</code>。Java 项目尤其明显。'
      ) +
      quote('镜像体积不是审美问题。它直接决定冷启动拉取时间、节点磁盘占用、以及每次发版的传输成本。')
  },
  {
    title: '还在改的方案：把博客搜索从 LIKE 换成 ES',
    summary: '一篇没写完的草稿，记录思路：为什么 LIKE 撑不住、IK 分词怎么配、以及降级到 MySQL 的兜底该怎么写。',
    authorSeq: 1,
    tagSeqs: [8],
    cover: null,
    status: '0',
    visibility: '0',
    daysAgo: 12,
    views: 0,
    html:
      h2('为什么 LIKE 不够用') +
      p(
        '<code>LIKE \'%关键词%\'</code> 无法用索引，数据量一上来就是全表扫描；而且中文没有空格分词，搜「缓存穿透」匹配不到「缓存击穿」。'
      ) +
      h2('待验证的点') +
      ul(
        'IK 分词器的词典要不要加技术术语（如 Vue、Redis 这类英文词的大小写归一）',
        '索引 mapping 里 summary 与 content 的权重怎么分',
        'ES 挂了之后降级到 LIKE 的切换阈值'
      ) +
      p('<em>（草稿：还没跑压测数据，暂不发布。）</em>')
  },
  {
    title: '我把自己的博客下线了一天',
    summary: '一次「主动下线」的复盘：为什么隐藏文章、隐藏和删除的区别、以及读者视角下应该看到什么。',
    authorSeq: 3,
    tagSeqs: [11],
    cover: 5,
    status: '1',
    visibility: '1',
    daysAgo: 20,
    views: 840,
    html:
      h2('起因') +
      p('有篇文章里的示例代码在生产环境跑出了事故，虽然文章本身没错，但我不想在没补充警告前让它继续传播。') +
      h2('隐藏不是删除') +
      p(
        '隐藏后文章还在、版本还在、链接会 404 但数据完整；删除是逻辑删除，作者自己也看不到了。前者可逆，后者要找回很麻烦。'
      ) +
      quote('内容平台的「下线」应该是可逆操作，且必须记录原因与操作人——这次我给自己补上了这条。') +
      h2('读者看到什么') +
      p('列表里消失，直达链接提示已下线。不显示「作者删除了」这类容易误解的文案。')
  },
  {
    title: '（已下线）一段被误用的并发示例代码',
    summary: '这篇文章里的示例在特定场景下会死锁，已由管理员下线，等待作者修订。',
    authorSeq: 2,
    tagSeqs: [1, 9],
    cover: null,
    status: '1',
    visibility: '2',
    daysAgo: 9,
    views: 1560,
    hiddenReason: '示例代码在高并发场景下可能造成死锁，需作者补充前置条件说明后重新发布',
    html:
      h2('示例代码（已标记风险）') +
      pre(
        'java',
        `synchronized (a) {
    // 这里如果另一个线程持有 b 再去拿 a，就会死锁
    synchronized (b) {
        // ...
    }
}`
      ) +
      p('本文已被管理员下线。示例缺少「加锁顺序一致性」的前置说明，直接照抄有风险。')
  }
]
