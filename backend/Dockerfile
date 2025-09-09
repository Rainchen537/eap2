# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括devDependencies，构建时需要）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

# 安装dumb-init用于信号处理
RUN apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY --chown=nestjs:nodejs package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从builder阶段复制构建产物
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# 创建uploads目录
RUN mkdir -p uploads && chown nestjs:nodejs uploads

# 切换到非root用户
USER nestjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["dumb-init", "node", "dist/main"]
