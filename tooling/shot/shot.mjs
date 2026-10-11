// blog-web 视觉基线截图工具（本地验证用，不参与构建、不进镜像）。
//
//   node shot.mjs                      # 全量：7 页 × 3 视口 × 2 主题
//   node shot.mjs --only=home,post     # 只拍指定页
//   node shot.mjs --views=mobile       # 只拍窄屏
//   node shot.mjs --themes=dark        # 只拍深色
//   SHOT_TOKEN=<blog-web-token 值> node shot.mjs --only=editor   # 需要登录态的页（作者中心）
//
// 输出到 blog-web/design/shots/（已在 .gitignore 内，属验证产物不入库）。
// 任一页面出现 console error / page error / 5xx 响应，末尾汇总并以退出码 1 结束，可直接当回归门禁。
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../design/shots');
const BASE = process.env.SHOT_BASE || 'http://localhost:3000';

// WSL 里缺 libnss3/libnspr4/libasound2 时，用 ./.libs 兜底（见 README「截图工具」一节）
process.env.LD_LIBRARY_PATH = [path.join(HERE, '.libs'), process.env.LD_LIBRARY_PATH]
  .filter(Boolean)
  .join(':');

// 无头 Chromium 不带中文字体时，中文会全渲染成豆腐块，截图失去判断价值。
// ./.fonts 里有解包好的 wqy-microhei 就生成一份 fontconfig（绝对路径在运行时拼，不写进仓库）。
const FONTDIR = path.join(HERE, '.fonts/usr/share/fonts');
if (existsSync(FONTDIR)) {
  const cfgDir = path.join(HERE, '.fontconfig');
  mkdirSync(cfgDir, { recursive: true });
  const cfg = path.join(cfgDir, 'fonts.conf');
  writeFileSync(
    cfg,
    `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>\n  <dir>${FONTDIR}</dir>\n  <cachedir>${path.join(cfgDir, 'cache')}</cachedir>\n</fontconfig>\n`
  );
  process.env.FONTCONFIG_FILE = cfg;
}

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1].split(',') : dflt;
};

const VIEWS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 }
};
const THEMES = ['dark', 'light'];
// 主题走 cookie：@nuxtjs/color-mode 配了 storage:cookie + emitOnAllHTTPRequests，
// 所以 SSR 首屏就带正确 class，不需要在页面里点切换按钮
const THEME_COOKIE = { name: 'sd-color-mode', value: '', url: BASE };

const PAGES = {
  home: { path: '/', full: true },
  post: { path: '', full: true },
  tags: { path: '/tags', full: true },
  search: { path: '/search?q=blog', full: true },
  user: { path: '', full: true },
  me: { path: '/me', full: true },
  editor: { path: '/me/new', full: false, auth: true },
  // 预期中的 404 页，不计控制台/状态噪声（它本身就是错误页）
  notfound: { path: '/no-such-page-xyz', full: false, quiet: true }
};

// 过滤：数组里含 'all' 即不筛（默认值就是 ['all']，故不能比字符串）
const pick = (list, keys) => (keys.includes('all') ? list : list.filter((v) => keys.includes(v)));

// 产物目录每次先清（只允许清 shots 目录，防误删）：避免旧命名/旧版本截图混在新结果里
if (path.basename(OUT) === 'shots') rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const problems = [];
let shots = 0;

// 运行时取真实 ID，避免硬编码写死的文章失效
const first = await (await fetch(`${BASE}/api/blog/public/articles?pageNum=1&pageSize=1`)).json();
const row = first?.rows?.[0];
if (!row) {
  console.error('取不到公共文章，检查 prod 是否在跑：', BASE);
  process.exit(1);
}
const ids = { post: `/post/${row.articleId}`, user: `/user/${row.authorId}` };
const onlyKeys = arg('only', ['all']);
console.log(`样本：文章 ${row.articleId} / 作者 ${row.authorId}`);

for (const theme of pick(THEMES, arg('themes', ['all']))) {
  for (const view of pick(Object.keys(VIEWS), arg('views', ['all']))) {
    const ctx = await browser.newContext({ viewport: VIEWS[view], colorScheme: theme });
    await ctx.addCookies([{ ...THEME_COOKIE, value: theme }]);
    if (process.env.SHOT_TOKEN) {
      await ctx.addCookies([{ name: 'blog-web-token', value: process.env.SHOT_TOKEN, url: BASE }]);
    }

    for (const [key, page] of Object.entries(PAGES).filter(([k]) => pick(Object.keys(PAGES), onlyKeys).includes(k))) {
      if (page.auth && !process.env.SHOT_TOKEN) continue;
      const p = await ctx.newPage();
      const errs = [];
      p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 160)));
      p.on('pageerror', (e) => errs.push(`pageerror: ${String(e).slice(0, 160)}`));
      p.on('response', (r) => r.status() >= 500 && errs.push(`HTTP ${r.status()} ${r.url().slice(-60)}`));
      try {
        await p.goto(BASE + (ids[key] || page.path), { waitUntil: 'networkidle', timeout: 20000 });
        await p.waitForTimeout(300);
        const file = path.join(OUT, `${key}-${view}-${theme}.png`);
        await p.screenshot({ path: file, fullPage: !!page.full });
        shots++;
        if (errs.length && !page.quiet) problems.push(`${key}-${view}-${theme}: ${[...new Set(errs)].join(' | ')}`);
      } catch (e) {
        problems.push(`${key}-${view}-${theme}: 导航失败 ${String(e.message).slice(0, 120)}`);
      } finally {
        await p.close();
      }
    }

    // 交互态只在桌面 + 深色拍一组（打磨 hover/弹层时最常用）
    if (view === 'desktop' && theme === 'dark') {
      const p = await ctx.newPage();
      try {
        await p.goto(BASE + '/', { waitUntil: 'networkidle' });
        const card = p.locator('article').first();
        await card.hover();
        await p.waitForTimeout(250);
        await p.screenshot({ path: path.join(OUT, `interaction-card-hover-${view}.png`) });
        shots++;

        await p.getByRole('button', { name: /登录/ }).first().click();
        await p.waitForTimeout(600);
        await p.screenshot({ path: path.join(OUT, `interaction-login-modal-${view}.png`) });
        shots++;
      } catch (e) {
        problems.push(`interaction: ${String(e.message).slice(0, 140)}`);
      } finally {
        await p.close();
      }
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`\n截图完成：${shots} 张 → design/shots/`);
if (problems.length) {
  console.log(`\n⚠️ 发现 ${problems.length} 处问题：`);
  problems.forEach((x) => console.log('  - ' + x));
  process.exit(1);
}
console.log('控制台/网络无报错。');
