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
