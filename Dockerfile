# blog-web 生产镜像（S9 部署，node-server 产物）
# 多阶段：构建期需要 devDependencies（nuxt/unocss 等），运行期只带 .output，避免几百 MB node_modules 进镜像。
# 构建：docker build -t blog-web .   （必须在 blog-web 目录内执行，上下文勿跨仓库）
# 运行：环境变量全部走 NUXT_* 注入（server-only runtimeConfig 在启动时读取，无需重新构建）
#   NUXT_API_BASE / NUXT_APP_CLIENT_ID / NUXT_RSA_PUBLIC_KEY / NUXT_RSA_PRIVATE_KEY
# 注意：.env 已被 .dockerignore 排除，真实密钥绝不进镜像层；由编排以 env_file/secret 注入。

# ---------- 构建阶段 ----------
FROM node:24-alpine AS build
WORKDIR /app

# 先装依赖，源码变更时充分利用镜像层缓存
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 仅复制构建所需文件（其余由 .dockerignore 排除）
COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    LANG=C.UTF-8 \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000
WORKDIR /app

# .output 为自包含 node-server 产物（含 node_modules 与静态资源）
COPY --from=build /app/.output ./.output

EXPOSE 3000

# Nitro node-server 自带健康可读日志；容器内 PID1 用 node，信号可正常转发
CMD ["node", ".output/server/index.mjs"]
