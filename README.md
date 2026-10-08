# blog-web · Stack Depth 博客前台

Nuxt 4 SSR 前台（读者站 + 登录作者中心，D29）。定位、红线与实现清单见 `AGENTS.md`、`docs/plan.md`；
视觉基线在 `design/`（参考非照抄）。后端契约与切片状态在同级仓库 `../RuoYi-Vue-Plus/docs/`。

## 环境变量（必读）

复制 `.env.example` 为 `.env` 并填值（`.env` 不入库）：

- `NUXT_APP_CLIENT_ID`：`sys_client` 的 `web` 记录 client_id，由
  `../RuoYi-Vue-Plus/docs/blog_s9_web_client.sql` 建立（与 plus-ui 的 `pc` 会话隔离）。
- `NUXT_RSA_PUBLIC_KEY` / `NUXT_RSA_PRIVATE_KEY`：后端 `api-decrypt.enabled=true` 且 `/auth/login`
  带 `@ApiEncrypt`，登录请求须按此密钥对加/解密；值与后端 `application.yml` 配对，生产必须更换。

⚠️ `npm run dev` 会自动加载 `.env`；**直接 `node .output/server/index.mjs` 不会**，缺 `NUXT_RSA_PUBLIC_KEY`
时登录会降级明文并被后端拒绝（表现为“没有访问权限，请联系管理员授权”）。生产启动请用下面的 `npm start`。

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm（推荐：带 --env-file-if-exists 加载 .env，登录加密链路依赖其中密钥）
npm start

# 或 Nuxt 自带预览（同样会读 .env）
npm run preview
```

> 容器/生产环境不必放 `.env`：直接注入 `NUXT_API_BASE`、`NUXT_APP_CLIENT_ID`、
> `NUXT_RSA_PUBLIC_KEY`、`NUXT_RSA_PRIVATE_KEY` 四个环境变量即可（见 `Dockerfile` 与后端仓库
> `script/docker/docker-compose.dev.yml` 的 `web` 服务）。

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## 视觉基线截图（本地验证工具，不参与构建）

`tooling/shot/` 是一个**独立小包**：不写进主 `package.json`、不进 `dependencies`、不进 Docker 镜像。
它用 Playwright 无头 Chromium 拍全站基线图到 `design/shots/`（已 gitignore），
并在任一页出现 console error / page error / 5xx 时以**退出码 1** 结束，可直接当回归门禁。

```bash
cd tooling/shot
npm i                              # 装 playwright（一次）
npx playwright install chromium    # 下浏览器到 ~/.cache/ms-playwright（一次，约 120MB）

node shot.mjs                                  # 全量：页面 × 3 视口(1440/768/390) × 2 主题
node shot.mjs --only=home,post                 # 只拍指定页
node shot.mjs --views=mobile --themes=dark     # 只拍窄屏深色
SHOT_TOKEN=<blog-web-token 值> node shot.mjs --only=editor   # 作者中心页需登录态时传 cookie
```

每次运行会**先清空** `design/shots/`，避免旧命名与新版截图混在一起。

### WSL 免 root 环境准备（本机已配好；重装后照此恢复）

精简 WSL Ubuntu 上的无头 Chromium 会缺两类东西，**都不需要 sudo**，解包到本目录即可（`.libs/`、`.fonts/` 已 gitignore）：

```bash
cd tooling/shot && mkdir -p .libs .fonts
mkdir -p /tmp/dl && cd /tmp/dl
apt-get download libnss3 libnspr4 libasound2t64 fonts-wqy-microhei   # 免 root 下载
for f in *.deb; do dpkg -x "$f" /tmp/px; done
cd -
cp /tmp/px/usr/lib/x86_64-linux-gnu/*.so* .libs/
cp -r /tmp/px/usr/share .fonts/          # 保持 .fonts/usr/share/fonts 层级，脚本按此路径生成 fontconfig
```

- 缺 `libnss3/libnspr4/libasound2` → 浏览器启动即退出（报 `Target page, context or browser has been closed`）；脚本会把 `.libs` 注入 `LD_LIBRARY_PATH`。
- 缺中文字体 → 中文全渲染成豆腐块 `□□□`，截图失去判断价值；脚本检测到 `.fonts/usr/share/fonts` 就自动生成 fontconfig（绝对路径运行时拼，不写进仓库）。
- 若有 root，`sudo npx playwright install-deps chromium` 可替代上面的 `.libs` 方案（中文字体仍需自装）。

> 注意：容器内中文字体是 **WQY 微米黑**，与你本机系统字体字形不同。截图用于判断**布局、层次、配色、间距、状态反馈**，不用于判断字体观感。
