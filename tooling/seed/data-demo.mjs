// =============================================================================
// 演示数据 · 扩展 42 篇（S26）
//
// 与 data-min.mjs 的 8 篇合并成 50 篇。这一组的目标是「版式饱满」：
// 首页要能翻 5 页、标签云有长尾、搜索有足够命中、详情页有长有短。
// 内容都按真实技术话题写，但篇幅比 min 收敛（每篇 2~3 个小节），避免演示数据喧宾夺主。
// =============================================================================

import { h2, p, ul, pre, quote } from './data-min.mjs'

export const POSTS_DEMO_EXTRA = [
  {
    title: 'JVM 内存模型与一次 OOM 排查实录',
    summary: '堆、元空间、直接内存各管什么，以及线上一次 java.lang.OutOfMemoryError: Metaspace 的完整定位过程。',
    authorSeq: 1, tagSeqs: [1, 9], cover: 6, status: '1', visibility: '0', daysAgo: 88, views: 6210,
    html: h2('三个容易混淆的区域') +
      ul('堆：对象实例，受 -Xmx 约束', '元空间：类元数据，受 -XX:MaxMetaspaceSize 约束', '直接内存：NIO / Netty 的堆外分配，受 -XX:MaxDirectMemorySize 约束') +
      h2('现场：Metaspace 缓慢上涨') +
      p('服务跑了三天后告警，GC 日志显示 Full GC 频繁但堆很空。用 <code>jcmd &lt;pid&gt; VM.metaspace</code> 看到类加载数量持续增长——是热部署的 ClassLoader 没释放。') +
      pre('bash', `jcmd $PID VM.metaspace summary
jmap -clstats $PID | head -20`) +
      h2('结论') +
      p('堆内存健康不等于没有内存问题。元空间与直接内存的泄漏都不会体现在 -Xmx 上。')
  },
  {
    title: 'Kafka 消息积压的排查路径',
    summary: '从 consumer lag 出发，分清是消费慢、分区不均，还是消费者掉线。给一套五分钟内能定位顺序的检查表。',
    authorSeq: 1, tagSeqs: [11, 19], cover: null, status: '1', visibility: '0', daysAgo: 83, views: 2140,
    html: h2('先看 lag，再看分布') +
      p('<code>kafka-consumer-groups --describe</code> 会列出每个分区的 lag。如果只有一个分区积压，是分区键设计问题；全部分区均匀积压，才是消费能力不足。') +
      pre('bash', `kafka-consumer-groups.sh --bootstrap-server localhost:9092 \\
  --describe --group order-consumer`) +
      h2('三种常见原因') +
      ul('消费逻辑里同步调用了慢接口', '分区数少于消费者数，多出来的消费者空转', 'rebalance 频繁触发，消费不断中断') +
      quote('积压不是靠加消费者解决的。先确认瓶颈在消费端还是分区数，加机器有时会让 rebalance 更糟。')
  },
  {
    title: 'Nginx 反代 WebSocket 长连接的三个必配项',
    summary: 'proxy_http_version、Upgrade 头透传、以及读超时——少一个就会出现「连上就断」或「几分钟后断」。',
    authorSeq: 4, tagSeqs: [13, 20], cover: null, status: '1', visibility: '0', daysAgo: 79, views: 1780,
    html: h2('最小可用配置') +
      pre('nginx', `location /ws/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}`) +
      h2('为什么默认配置一定会断') +
      p('HTTP/1.0 不支持长连接，Nginx 默认读超时 60s——不设 <code>proxy_read_timeout</code> 的话，安静的长连接会在 60 秒后被服务端关掉。') +
      h2('顺带一个坑') +
      p('如果前面还有一层云负载均衡，它的空闲超时通常也是 60s，两层都要改。')
  },
  {
    title: '前端性能优化：从 Lighthouse 64 分到 95 分',
    summary: '一次真实的调优记录。掉分的不是 JS，是三张未压缩的封面原图和 101 条 @font-face 声明。',
    authorSeq: 3, tagSeqs: [10, 12], cover: 7, status: '1', visibility: '0', daysAgo: 71, views: 5320,
    html: h2('先看扣分项，别看总分') +
      p('Lighthouse 的 Performance 是加权分。打开 details 会看到 <code>total-byte-weight</code> 只有 50 分——3.8MB 的首屏字节几乎全是未裁剪的封面原图。') +
      h2('三个动作') +
      ul('图片按展示尺寸取，不是按原图直出', '字体子集化 + 按字符集分片，首屏只下用到的片', '把渲染阻塞的 CSS 拆出关键部分') +
      h2('一个反直觉的事实') +
      p('减少 JS 体积对 DCL 有帮助，但对 LCP 往往没感觉——因为 LCP 元素通常是图片或标题文字，早已被更早的资源卡住。') +
      quote('优化要先确定 LCP 元素是什么，再决定砍什么。否则容易优化了不影响分数的部分。')
  },
  {
    title: 'CSS 布局演进：从 Float 到 Grid',
    summary: '不是历史课。讲清楚每种方案当年解决什么、留下什么坑，以及为什么现在仍然会见到 float 清浮动。',
    authorSeq: 3, tagSeqs: [12], cover: null, status: '1', visibility: '0', daysAgo: 66, views: 1490,
    html: h2('Float 本来是给文字环绕的') +
      p('用它做多列布局是历史误会，代价是要清浮动、要用 clearfix 这类补丁。') +
      h2('Flex 解决一维分布') +
      pre('css', `.row {
  display: flex;
  gap: 16px;
  align-items: center;
}`) +
      h2('Grid 解决二维网格') +
      p('两列布局里，Flex 需要一层容器 + 一层子项配合；Grid 一行 <code>grid-template-columns: 1fr 320px</code> 就能表达「主区自适应、侧栏固定」。') +
      quote('选择标准很简单：一行或一列用 Flex，行列都要控制用 Grid。混用没问题，但别用 float 了。')
  },
  {
    title: 'HTTP/2 与 HTTP/3：多路复用到 QUIC',
    summary: '从队头阻塞讲起，解释 HTTP/2 解决了什么、又在丢包时退化为什么，以及 QUIC 为什么把传输层换掉。',
    authorSeq: 4, tagSeqs: [20], cover: null, status: '1', visibility: '0', daysAgo: 62, views: 2260,
    html: h2('HTTP/1.1 的三个补救') +
      p('域名分片、雪碧图、资源内联——本质都是为了绕过「一个连接一次只能处理一个请求」。') +
      h2('HTTP/2 的多路复用') +
      p('帧化 + 流 ID，让一个 TCP 连接并发跑多个请求。但它仍然共享一条 TCP，一旦丢包，所有流一起等重传。') +
      h2('QUIC 把可靠传输搬进用户态') +
      p('基于 UDP 自建拥塞控制与重传，丢包只影响那一个流。代价是部分网络环境对 UDP 不友好，需要回落机制。')
  },
  {
    title: 'Git 分支模型：GitFlow、Trunk-Based 与团队规模',
    summary: '5 人团队用 GitFlow 会累死，50 人用纯主干又容易互相踩。给出按团队规模选择的判断依据。',
    authorSeq: 4, tagSeqs: [15], cover: null, status: '1', visibility: '0', daysAgo: 58, views: 3120,
    html: h2('GitFlow 的成本在哪') +
      p('五条长期分支意味着每次发版都要做合并、打 tag、再合回 develop。小团队没有人专职管发布，这套流程会迅速变成负担。') +
      h2('Trunk-Based 的前提') +
      ul('有可靠的自动化测试', '发布与部署解耦（开关 / 灰度）', '提交粒度足够小') +
      quote('分支模型的本质是「并行开发度的管理」。约束在于合并成本，而不在于工具。')
  },
  {
    title: '日志规范：结构化日志与链路追踪',
    summary: '日志不是越多越好。讲清结构化字段怎么设计、traceId 怎么透传、以及什么不该打进日志。',
    authorSeq: 1, tagSeqs: [11], cover: null, status: '1', visibility: '0', daysAgo: 55, views: 1860,
    html: h2('从字符串拼接改成结构化字段') +
      pre('java', `log.info("order paid", kv("orderId", id), kv("amount", amount), kv("channel", ch));`) +
      p('好处是能被日志系统按字段检索与聚合，而不是靠正则去抠。') +
      h2('什么不该进日志') +
      ul('密码、token、身份证号等敏感信息', '完整请求体（体积与合规风险）', '高频循环里逐条打的 debug 日志')
  },
  {
    title: '单元测试的价值边界：什么该测、什么不该测',
    summary: '不是覆盖率越高越好。区分「纯逻辑」与「接线代码」，把测试预算花在会出错的地方。',
    authorSeq: 1, tagSeqs: [16], cover: null, status: '1', visibility: '0', daysAgo: 51, views: 2410,
    html: h2('值得测的') +
      ul('状态机转换与边界条件', '解析、规范化、拼装这类纯函数', '曾经出过 bug 的地方（回归测试）') +
      h2('不值得测的') +
      ul('getter / setter 与简单映射', '框架已经保证的行为', '为了覆盖率而写的断言空壳') +
      quote('测试的价值在于「改错时会红」。一条永远绿的测试，不如没有。')
  },
  {
    title: '代码评审清单：200 次 Review 总结的 12 条',
    summary: '按「必须改 / 建议改 / 可以聊」三档归类，避免把个人偏好当成阻塞项。',
    authorSeq: 1, tagSeqs: [11], cover: null, status: '1', visibility: '0', daysAgo: 47, views: 4580,
    html: h2('必须改') +
      ul('并发与事务边界是否正确', '异常是否被吞掉', '是否引入 N+1 查询', '敏感信息是否落日志', '是否有破坏性变更未标注') +
      h2('建议改') +
      ul('命名是否表意', '是否有更简单的写法', '重复逻辑能否提取') +
      h2('可以聊') +
      ul('风格偏好', '更激进的架构调整') +
      quote('把个人偏好标成「必须改」是评审最常见的摩擦源。分档之后，讨论会顺畅很多。')
  },
  {
    title: 'TypeScript 类型体操：从 Partial 到递归条件类型',
    summary: '把内置工具类型的实现摊开看，理解映射类型、条件类型与 infer 三个机制怎么组合出表达力。',
    authorSeq: 3, tagSeqs: [6], cover: null, status: '1', visibility: '0', daysAgo: 44, views: 3680,
    html: h2('Partial 只是映射类型') +
      pre('typescript', `type Partial<T> = {
  [K in keyof T]?: T[K];
};`) +
      h2('条件类型 + infer 提取') +
      pre('typescript', `type ElementOf<T> = T extends Array<infer U> ? U : never;`) +
      h2('递归处理嵌套') +
      p('深度 Partial 需要在值仍是对象时继续递归，同时防止无限递归——通常加一个深度参数或终止条件。') +
      quote('类型体操的实用边界是「让调用方少写错」，而不是炫技。读不懂的类型不如 any。')
  },
  {
    title: 'MySQL 事务隔离级别：幻读到底能不能避免',
    summary: '四种隔离级别各自解决什么、MVCC 与间隙锁分别在哪一层起作用，以及为什么 RR 下仍会遇到幻读。',
    authorSeq: 2, tagSeqs: [3, 17], cover: 8, status: '1', visibility: '0', daysAgo: 40, views: 4890,
    html: h2('四种级别与它们的问题') +
      ul('读未提交：脏读', '读已提交：不可重复读', '可重复读：理论上有幻读', '串行化：性能代价') +
      h2('MVCC 让「读」不用加锁') +
      p('快照读走 undo log 版本链，所以 RR 下的普通 SELECT 能保持一致。') +
      h2('幻读出现在当前读') +
      p('<code>SELECT ... FOR UPDATE</code> 是当前读，必须加锁。InnoDB 用间隙锁把区间锁住来防插入——但如果查询没走索引，它会锁全表，代价极大。') +
      quote('「RR 能防幻读」这句话只在快照读成立。当前读要靠间隙锁，而间隙锁的代价经常被低估。')
  },
  {
    title: '分布式锁的四种实现与它们的坑',
    summary: '数据库唯一键、Redis SETNX、Redlock、ZooKeeper 临时节点。逐个说清适用场景与失效边界。',
    authorSeq: 1, tagSeqs: [11, 19], cover: null, status: '1', visibility: '0', daysAgo: 37, views: 3920,
    html: h2('Redis 方案的最小正确写法') +
      pre('lua', `-- 加锁：原子设置 + 过期，避免 SETNX 与 EXPIRE 之间崩溃
SET resource_name my_random_value NX PX 30000`) +
      p('释放时必须校验 value 再删，否则可能删掉别人刚加的锁。用 Lua 脚本保证原子性。') +
      h2('三种常见失效') +
      ul('业务执行超过锁过期时间', '主从切换导致锁丢失', '没有唯一 value 校验就删锁')
  },
  {
    title: 'Elasticsearch 中文分词：词典与召回率',
    summary: 'IK 的 ik_smart 与 ik_max_word 何时用哪个，技术术语词典怎么补，以及召回率低的三个排查方向。',
    authorSeq: 2, tagSeqs: [8], cover: null, status: '1', visibility: '0', daysAgo: 34, views: 2050,
    html: h2('两个模式的区别') +
      p('<code>ik_max_word</code> 切得细，索引时用；<code>ik_smart</code> 切得粗，搜索时用。反了会导致召回异常。') +
      h2('技术术语必须加词典') +
      p('默认词典会把「微服务」切成「微」「服务」，把 Redis 当英文单词。自定义 <code>tech.dic</code> 后效果立竿见影。') +
      quote('分词的调优目标不是「切得准」，是「搜得到」。先定召回，再谈精度。')
  },
  {
    title: 'Nuxt 4 目录结构变化：app/ 目录带来了什么',
    summary: 'srcDir 从根目录挪进 app/，server/ 与 public/ 保持在外。解释这个调整解决的问题与升级要动的配置。',
    authorSeq: 3, tagSeqs: [5, 12], cover: null, status: '1', visibility: '0', daysAgo: 31, views: 1720,
    html: h2('变化本身') +
      pre('text', `app/
  ├── pages/
  ├── components/
  └── plugins/
server/
public/`) +
      h2('解决什么') +
      p('把「前端代码」与「服务端 / 静态资源」分开，自动导入与类型生成的范围更明确，也减少了根目录的文件噪声。') +
      h2('升级要注意') +
      p('自定义 <code>srcDir</code>、直接写相对路径的 import、以及部分模块的目录约定都要跟着改。')
  },
  {
    title: 'Vite 插件开发入门：从 transform 钩子说起',
    summary: '一个最小插件能做什么：解析、转换、注入。用 transform 把指定注释替换成构建信息。',
    authorSeq: 3, tagSeqs: [12], cover: null, status: '1', visibility: '0', daysAgo: 28, views: 1340,
    html: h2('最小插件') +
      pre('javascript', `export default function buildInfo() {
  return {
    name: 'build-info',
    transform(code, id) {
      if (!id.endsWith('.vue')) return;
      return code.replace(/__BUILD_TIME__/g, new Date().toISOString());
    }
  };
}`) +
      h2('常见误区') +
      p('transform 会对每个模块调用，务必先做 id 过滤，否则编译会明显变慢。')
  },
  {
    title: 'pnpm workspace 实践：monorepo 的依赖治理',
    summary: 'workspace 协议、hoisting 的取舍、以及为什么 pnpm 的严格 node_modules 反而减少了「幽灵依赖」。',
    authorSeq: 3, tagSeqs: [7, 12], cover: null, status: '1', visibility: '0', daysAgo: 25, views: 1980,
    html: h2('依赖声明要显式') +
      pre('yaml', `packages:
  - 'apps/*'
  - 'packages/*'`) +
      h2('严格结构的代价与收益') +
      p('npm 的扁平化会把未声明的依赖也提升到顶层，代码能跑但依赖是隐式的。pnpm 用符号链接恢复「谁能看到谁」，代价是偶尔要显式声明 peer。') +
      quote('幽灵依赖在本地无感，在换包管理器或升级时集中爆发。')
  },
  {
    title: 'MySQL 8 窗口函数速查',
    summary: 'ROW_NUMBER、RANK、LAG/LEAD 与聚合窗口，配三个真实场景：分组取最新、环比计算、去重。',
    authorSeq: 2, tagSeqs: [3], cover: null, status: '1', visibility: '0', daysAgo: 22, views: 2510,
    html: h2('分组取最新一条') +
      pre('sql', `SELECT * FROM (
  SELECT t.*, ROW_NUMBER() OVER (
    PARTITION BY user_id ORDER BY created_at DESC
  ) AS rn
  FROM orders t
) x WHERE rn = 1;`) +
      h2('环比') +
      pre('sql', `SELECT month, amount,
       LAG(amount) OVER (ORDER BY month) AS prev,
       amount - LAG(amount) OVER (ORDER BY month) AS diff
FROM monthly_stats;`) +
      quote('窗口函数不改变行数，聚合会。选错的典型症状是「结果少了一半行」。')
  },
  {
    title: 'Redis 持久化：RDB 与 AOF 怎么选',
    summary: '两种机制的数据安全边界不同。讲清 fork 开销、AOF 重写、以及混合持久化为什么成为默认推荐。',
    authorSeq: 2, tagSeqs: [4, 18], cover: null, status: '1', visibility: '0', daysAgo: 19, views: 2340,
    html: h2('RDB 是快照') +
      p('按时间点 fork 子进程写盘。恢复快，但两次快照之间的数据会丢。fork 时内存翻倍的风险在大实例上不能忽略。') +
      h2('AOF 是日志') +
      p('逐条记录写命令，<code>appendfsync everysec</code> 最多丢一秒。代价是文件膨胀，需要重写。') +
      h2('混合持久化') +
      p('Redis 4.0 起可开启 <code>aof-use-rdb-preamble</code>：重写时前半段是 RDB 快照、后半段是增量命令，兼顾恢复速度与数据安全。')
  },
  {
    title: 'JVM 调优参数速查表（含常见误配）',
    summary: '堆、元空间、GC 选择、日志参数。附三个「配了反而更慢」的案例。',
    authorSeq: 1, tagSeqs: [1, 9], cover: null, status: '1', visibility: '0', daysAgo: 17, views: 3760,
    html: h2('基本盘') +
      pre('bash', `-Xms4g -Xmx4g                 # 固定堆，避免动态扩缩
-XX:MaxMetaspaceSize=512m
-XX:+UseG1GC
-Xlog:gc*:file=/var/log/gc.log:time,uptime:filecount=5,filesize=50M`) +
      h2('三个误配') +
      ul('-Xmn 设得过大，导致老年代频繁 Full GC', '同时开 G1 与 CMS 相关参数，互相冲突', 'GC 日志没开，出问题只能靠猜') +
      quote('先开日志再调参。没有 GC 日志的调优是在盲改。')
  },
  {
    title: 'Shell 脚本的十个安全写法',
    summary: 'set -euo pipefail、引号、临时文件、信号处理。每一条都配反例。',
    authorSeq: 4, tagSeqs: [14], cover: null, status: '1', visibility: '0', daysAgo: 15, views: 1620,
    html: h2('开头三行') +
      pre('bash', `#!/usr/bin/env bash
set -euo pipefail
IFS=$'\\n\\t'`) +
      h2('两个高频错误') +
      ul('变量不加引号，路径含空格就断', '用 <code>rm -rf $DIR/</code> 而 <code>DIR</code> 为空') +
      h2('临时文件') +
      p('用 <code>mktemp</code> 并注册 <code>trap</code> 清理，别写死 <code>/tmp/a.txt</code>。')
  },
  {
    title: 'RESTful API 设计中的五个常见错误',
    summary: '动词进路径、状态码乱用、分页参数不一致、错误结构不统一、以及 GET 带副作用。',
    authorSeq: 1, tagSeqs: [11], cover: null, status: '1', visibility: '0', daysAgo: 13, views: 2880,
    html: h2('动词进路径') +
      p('<code>POST /articles/create</code> 不如 <code>POST /articles</code>。HTTP 方法本身就是动词。') +
      h2('状态码') +
      ul('参数校验失败用 400，不要用 500', '未登录 401，无权限 403，不要混', '创建成功返回 201 并带 Location') +
      h2('错误结构统一') +
      pre('json', `{ "code": 40001, "msg": "标题不能为空", "data": null }`) +
      quote('API 是给别人用的契约。一致比「更合理」重要。')
  },
  {
    title: '如何写好一份技术方案',
    summary: '方案不是文档堆砌。讲清背景、目标与非目标、备选方案对比、风险与回滚，四段结构就够。',
    authorSeq: 1, tagSeqs: [11], cover: 9, status: '1', visibility: '0', daysAgo: 11, views: 4120,
    html: h2('四段结构') +
      ul('背景：现在有什么问题，为什么现在要做', '目标与非目标：明确不做什么，避免范围蔓延', '备选方案：至少两个，含否决理由', '风险与回滚：出问题怎么退') +
      h2('最常被跳过的「非目标」') +
      p('不写非目标，评审时就会不断有人问「那 X 也一起做了吧」。写下不做，比写下做更难，也更重要。') +
      quote('好方案的标准不是「写得全」，是「别人看完能判断该不该批」。')
  },
  {
    title: 'Spring Security 与 Sa-Token 的取舍',
    summary: '一个偏标准、一个偏易用。从学习曲线、扩展点、与现有权限模型的契合度三个维度对比。',
    authorSeq: 1, tagSeqs: [1, 2], cover: null, status: '1', visibility: '0', daysAgo: 10, views: 3460,
    html: h2('Spring Security 的强项') +
      p('标准化、生态完整、与 OAuth2 集成成熟。代价是过滤器链的调试成本高，一个配置错误常常表现为「403 但不知道为什么」。') +
      h2('Sa-Token 的强项') +
      p('注解即鉴权，<code>@SaCheckLogin</code>、<code>@SaCheckPermission</code> 读起来就是意图。对中小项目更高效。') +
      h2('判断依据') +
      p('需要对接标准协议（OIDC / SAML）选 Security；自建用户体系、追求开发效率选 Sa-Token。')
  },
  {
    title: '从单体到微服务：不该走的那一步',
    summary: '拆服务的前提是团队与部署已经痛到必须拆。列出四个「其实还没到时候」的信号。',
    authorSeq: 1, tagSeqs: [11, 19], cover: null, status: '1', visibility: '0', daysAgo: 9, views: 5240,
    html: h2('四个还没到时候的信号') +
      ul('团队不到 10 人，沟通成本本来就低', '没有自动化部署，拆完只会更痛', '领域边界还没摸清，拆了就要不停改接口', '单体性能瓶颈还没定位到具体模块') +
      h2('先做什么') +
      p('模块化单体：清晰的模块边界 + 单向依赖，等到某模块真的需要独立扩容时再拆，成本低一个数量级。') +
      quote('微服务解决的是组织问题，不是性能问题。把它当性能方案，通常会失望。')
  },
  {
    title: '缓存一致性：先删缓存还是先更库',
    summary: 'Cache Aside 的两种顺序都与「并发读写」有关。讲清延迟双删的适用条件与它的局限。',
    authorSeq: 2, tagSeqs: [4, 18], cover: null, status: '1', visibility: '0', daysAgo: 8, views: 3050,
    html: h2('两种顺序的问题') +
      p('先删缓存再更库：删除后、更新前的窗口里，读请求会把旧值重新写回缓存。先更库再删缓存：删除失败就长期不一致。') +
      h2('延迟双删') +
      p('更新后延迟一小段时间再删一次，覆盖那个窗口。但延迟时长难定，且不解决删除失败。') +
      h2('更可靠的思路') +
      p('缓存设过期时间做兜底 + 通过 binlog 订阅异步失效，把「一致性」降级为「最终一致」，这才是大多数业务的真实需求。')
  },
  {
    title: '数据库连接池的常见误配',
    summary: '池子不是越大越好。连接数超过数据库处理能力时，等待只是从应用层转移到了数据库层。',
    authorSeq: 2, tagSeqs: [3, 17], cover: null, status: '1', visibility: '0', daysAgo: 7, views: 1960,
    html: h2('一个够用的估算') +
      p('连接数 ≈ CPU 核数 × 2 + 磁盘数。四核机器上配 200 个连接，实际并行度仍然受 CPU 限制，多出来的连接只是在抢锁。') +
      h2('三个必调参数') +
      ul('最大连接数', '获取连接超时（不设会无限等）', '空闲连接回收') +
      quote('池子配大了，故障时表现为「数据库 CPU 100% 但 QPS 很低」。')
  },
  {
    title: '慢 SQL 治理的完整流程',
    summary: '从开启慢日志到上线验证，六步闭环。附一条真实优化：从 2.3s 到 40ms。',
    authorSeq: 2, tagSeqs: [3, 10], cover: null, status: '1', visibility: '0', daysAgo: 6, views: 2740,
    html: h2('六步') +
      ul('开慢日志并定阈值', '按总耗时排序（不是按单次耗时）', 'EXPLAIN 看执行计划', '判断是索引问题还是查询结构问题', '改写并回归', '上线后对比') +
      h2('一个真实案例') +
      p('2.3s 的查询是「按时间范围 + 状态过滤 + 排序」，索引建在时间上但没带状态，导致回表量巨大。改成联合索引 <code>(status, created_at)</code> 后降到 40ms。') +
      quote('慢 SQL 优化要先算「回表次数」，再决定加什么索引。')
  },
  {
    title: '前端状态管理的边界',
    summary: '不是所有状态都该进 store。区分服务端状态、UI 状态、表单状态，避免把缓存问题当状态问题。',
    authorSeq: 3, tagSeqs: [5, 12], cover: null, status: '1', visibility: '0', daysAgo: 5, views: 2180,
    html: h2('三类状态') +
      ul('服务端状态：应该由请求库管理（缓存、失效、重试）', 'UI 状态：弹层开关、选中项，放组件或轻量 store', '表单状态：跟随表单库，不要全局化') +
      h2('最常见的问题') +
      p('把接口数据塞进全局 store 再手动维护失效，等于自己实现一遍请求库已经做好的事，还容易不一致。')
  },
  {
    title: '组件库设计的三个取舍',
    summary: '灵活性与一致性、受控与非受控、以及「要不要暴露 DOM」。每个取舍都影响后续所有使用者。',
    authorSeq: 3, tagSeqs: [5, 12], cover: null, status: '1', visibility: '0', daysAgo: 4, views: 1560,
    html: h2('灵活 vs 一致') +
      p('暴露太多 props 会让组件库失去统一观感，暴露太少则业务会 fork 一份自己改。折中是提供「受主题变量约束的有限扩展」。') +
      h2('受控 vs 非受控') +
      p('受控便于外部联动，但每次都要写 v-model；非受控简单，却难做联动。多数组件应该两者都支持。') +
      h2('要不要暴露 DOM') +
      p('暴露 ref 便于聚焦、滚动等操作，但也让使用者依赖内部结构。折中是暴露有限方法而不是元素本身。')
  },
  {
    title: '无障碍不是可选项：WCAG 入门',
    summary: '对比度、可访问名称、键盘可达、语义标签。四个最容易踩的点，配具体的反例。',
    authorSeq: 3, tagSeqs: [12], cover: null, status: '1', visibility: '0', daysAgo: 3, views: 1880,
    html: h2('四个高频问题') +
      ul('对比度不足（正文要以 4.5:1 为线）', '可访问名称与可见文字不一致（语音控制点不到）', '自定义按钮没有键盘焦点', '只用颜色区分状态') +
      h2('一个具体的反例') +
      p('按钮可见文字是「浅色」，但 <code>aria-label</code> 写的是「切换到深色」——语音用户说「点击浅色」永远点不到。') +
      quote('无障碍的收益不只是少数用户。键盘可达、语义清晰，对所有人都是体验提升。')
  },
  {
    title: '深色模式的实现陷阱',
    summary: '不是加一个 .dark 类就完了。图片、阴影、边框、以及第三方组件的变量覆盖，四个地方最容易破。',
    authorSeq: 3, tagSeqs: [12], cover: null, status: '1', visibility: '0', daysAgo: 3, views: 2460,
    html: h2('阴影在深色下几乎不可见') +
      p('深色背景上黑色阴影失效，通常改用「边框 + 略亮的底色」来表达层级。') +
      h2('图片要压暗') +
      p('白底截图在深色页面上刺眼，加一层 <code>filter: brightness(.9)</code> 或降低不透明度会舒服很多。') +
      h2('第三方组件') +
      p('富文本编辑器、图表库往往有自己的一套配色，必须逐个用变量覆盖，否则会出现「页面是深色、编辑器是白底」。')
  },
  {
    title: '字体加载与 CLS：为什么换了字体页面会跳',
    summary: 'font-display 的三种取值、字体度量差异、以及用 size-adjust 消除布局偏移。',
    authorSeq: 3, tagSeqs: [10, 12], cover: null, status: '1', visibility: '0', daysAgo: 2, views: 1390,
    html: h2('跳动的来源') +
      p('回退字体与目标字体的字宽、行高不同，字体加载完成后文字重排，产生 CLS。') +
      h2('三种缓解') +
      ul('<code>font-display: swap</code> 先显示回退字体（会跳）', '<code>optional</code> 加载慢就不用（不跳但可能不生效）', '用 <code>size-adjust</code> 对齐回退字体的度量（不跳且生效）') +
      pre('css', `@font-face {
  font-family: 'Noto Serif SC';
  src: url('/fonts/noto-serif-sc.woff2') format('woff2');
  font-display: swap;
  size-adjust: 96%;
}`)
  },
  {
    title: '图片优化的正确姿势',
    summary: '尺寸、格式、懒加载、占位。四条按收益排序，并解释为什么「先压到 100KB 以下」往往是错的。',
    authorSeq: 3, tagSeqs: [10], cover: null, status: '1', visibility: '0', daysAgo: 2, views: 2010,
    html: h2('收益排序') +
      ul('按展示尺寸出图（通常能砍 80%）', '换现代格式（WebP/AVIF，再砍 30~50%）', '首屏外懒加载', '固定宽高比占位防抖动') +
      h2('一个常见误区') +
      p('把 2000px 的图压到 100KB，视觉上糊了，但传输量仍然大于一张 400px 的清晰图。尺寸优先于压缩率。') +
      quote('最有效的图片优化是「别传这么大的图」，而不是「想尽办法压小它」。')
  },
  {
    title: 'CDN 缓存策略设计：把命中率做到 95%',
    summary: 'Cache-Control 的组合、版本化资源的强缓存、HTML 的协商缓存，以及回源风暴的预防。',
    authorSeq: 4, tagSeqs: [13, 10], cover: null, status: '1', visibility: '0', daysAgo: 1, views: 1670,
    html: h2('两类资源的两种策略') +
      pre('nginx', `# 带 hash 的静态资源：强缓存一年
location ~* \\.[0-9a-f]{8}\\.(js|css)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML：不缓存，每次协商
location = /index.html {
  add_header Cache-Control "no-cache";
}`) +
      h2('回源风暴') +
      p('缓存同时过期会让请求瞬间打满源站。给 TTL 加随机偏移，或在 CDN 侧开启 stale-while-revalidate。')
  },
  {
    title: 'HTTPS 握手都发生了什么',
    summary: 'TLS 1.2 与 1.3 的握手对比、证书链校验、以及为什么 1.3 能省一个往返。',
    authorSeq: 4, tagSeqs: [20], cover: null, status: '1', visibility: '0', daysAgo: 1, views: 2130,
    html: h2('TLS 1.2 的两个往返') +
      p('客户端问候 → 服务端问候 + 证书 → 客户端校验证书并生成密钥 → 双方切换加密。') +
      h2('TLS 1.3 砍掉了什么') +
      p('把密钥交换提前到第一个往返，并移除了 RSA 密钥交换等不安全套件。首次连接省一个 RTT，会话恢复可以做到 0-RTT。') +
      h2('证书链校验') +
      p('浏览器从站点证书往上追到受信任根，任何一环缺失或过期都会失败。中间证书忘配是线上最常见的握手失败原因。')
  },
  {
    title: 'Linux 内存排查：free 为什么不准',
    summary: 'buff/cache 不是「被占用」，available 才是判断依据。附三个真正需要警惕的信号。',
    authorSeq: 4, tagSeqs: [14], cover: null, status: '1', visibility: '0', daysAgo: 1, views: 3240,
    html: h2('先看 available') +
      p('<code>free</code> 的 <code>free</code> 列经常接近 0，那是内核把空闲内存拿去做缓存了，可回收。<code>available</code> 才是「新进程能用多少」。') +
      h2('三个真信号') +
      ul('available 持续下降且不回升', 'swap 使用量持续增长', 'dmesg 里出现 OOM killer 记录') +
      quote('「内存不够」的判断标准是 OOM 或 swap 抖动，不是 free 列数字小。')
  },
  {
    title: 'systemd 与容器化进程管理',
    summary: '容器里该不该用 systemd、PID 1 的信号处理、以及优雅停机的超时配置。',
    authorSeq: 4, tagSeqs: [7, 14], cover: null, status: '1', visibility: '0', daysAgo: 1, views: 1180,
    html: h2('容器不要跑 systemd') +
      p('容器的职责是跑一个前台进程。用 systemd 管多个服务会让信号转发、日志收集、健康检查全部变复杂，这些本该由编排层负责。') +
      h2('PID 1 的信号') +
      p('如果应用不是 PID 1，SIGTERM 可能收不到。用 <code>exec</code> 形式启动，或加 <code>--init</code> 让 tini 转发信号。') +
      pre('bash', `# 正确：exec 让 java 成为 PID 1
ENTRYPOINT ["sh", "-c", "exec java -jar app.jar"]`)
  },
  {
    title: '灰度发布的几种实现',
    summary: '按流量比例、按用户、按请求头。分别说明实现位置（网关 / 服务内 / 前端）与回滚代价。',
    authorSeq: 4, tagSeqs: [11, 19], cover: null, status: '1', visibility: '0', daysAgo: 0, views: 1920,
    html: h2('三种粒度') +
      ul('流量比例：网关按权重分流，实现简单，问题定位难', '按用户：一致性哈希或白名单，体验稳定', '按请求头：便于内部先验，需上游配合') +
      h2('回滚的关键') +
      p('新老版本要能同时读写同一份数据。若涉及表结构变更，必须先做「兼容双向」的迁移，否则回滚会丢数据。') +
      quote('灰度的难点不在分流，在数据兼容。')
  },
  {
    title: '监控告警：从指标到可执行',
    summary: '告警要能指向动作。区分「需要人处理」与「只需记录」，避免告警疲劳。',
    authorSeq: 1, tagSeqs: [11], cover: null, status: '1', visibility: '0', daysAgo: 0, views: 1450,
    html: h2('三类指标') +
      ul('黄金指标：延迟、流量、错误、饱和度', '业务指标：下单量、支付成功率', '资源指标：CPU、内存、磁盘') +
      h2('告警设计') +
      p('每条告警都要能回答「收到之后第一步做什么」。答不上来的，应该降级为看板而不是告警。') +
      quote('告警疲劳的代价是真实的：当所有告警都被忽略，等于没有监控。')
  },
  {
    title: '技术债的量化与偿还',
    summary: '技术债不是道德问题。用「修改成本」与「故障概率」两个维度排序，把偿还排进迭代。',
    authorSeq: 1, tagSeqs: [11], cover: null, status: '1', visibility: '0', daysAgo: 0, views: 2280,
    html: h2('两个维度') +
      ul('修改成本：每次改这块要多久、要动几个文件', '故障概率：这块最近出过几次问题') +
      h2('四象限') +
      p('高成本 + 高故障：立刻还；高成本 + 低故障：排期还；低成本 + 高频：随手还；低成本 + 低频：记录即可。') +
      quote('最糟的不是有技术债，是没人知道债在哪、有多贵。')
  },
  {
    title: '写了三年博客之后',
    summary: '一些与工具无关的体会：为什么写、写什么、以及如何避免写成「文档搬运」。',
    authorSeq: 5, tagSeqs: [11], cover: null, status: '1', visibility: '0', daysAgo: 0, views: 3860,
    html: h2('为什么写') +
      p('写下来是检验「真的懂了」最便宜的方式。能讲清楚的部分才是自己的，剩下的会在写作过程中暴露。') +
      h2('写什么') +
      p('只写自己踩过并解决了的。转述官方文档没有价值——读者可以直接读官方文档。') +
      h2('一个反模式') +
      p('开头先写一大段「什么是 X」的定义。读者点进来多半已经知道 X 是什么，他们想知道的是你遇到的问题。') +
      quote('好文章的开头是一句具体的困扰，不是一句教科书定义。')
  },
  {
    title: '（草稿）前端 monorepo 的构建缓存',
    summary: '记录一个还没验证完的想法：用内容哈希做任务级缓存，避免整仓重建。',
    authorSeq: 3, tagSeqs: [12, 7], cover: null, status: '0', visibility: '0', daysAgo: 4, views: 0,
    html: h2('待验证') +
      ul('输入指纹怎么算（源文件 + 依赖版本 + 环境变量）', '输出目录怎么做失效判断', '跨机器共享缓存的可信边界') +
      p('<em>（草稿：还在试，先把思路记下来。）</em>')
  },
  {
    title: '（已下线）一次误导性的性能对比',
    summary: '文中基准测试的机器配置未注明，结论不可复现，已由管理员下线。',
    authorSeq: 4, tagSeqs: [10], cover: null, status: '1', visibility: '2', daysAgo: 2, views: 980,
    hiddenReason: '基准测试未注明运行环境与版本，结论不可复现，需补充实验条件后重新发布',
    html: h2('原文结论（已作废）') +
      p('原文声称某框架比另一框架快 3 倍，但未注明并发数、数据规模与硬件配置，实测无法复现。') +
      p('本文已被管理员下线。')
  }
]
