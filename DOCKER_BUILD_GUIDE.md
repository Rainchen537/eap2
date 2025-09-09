# QuizOnly Docker 构建指南

## 🔧 修复的问题

### 1. 后端构建错误修复

**问题**: `nest: not found`
- **原因**: Docker构建时只安装了生产依赖，缺少 `@nestjs/cli`
- **解决**: 构建阶段安装所有依赖，生产阶段只安装生产依赖

### 2. 前端构建错误修复

**问题1**: `crypto.hash is not a function` 和 Node.js 版本要求
- **原因**: Vite 7.x 要求 Node.js 20.19+ 或 22.12+
- **解决**: 升级 Docker 镜像从 `node:18-alpine` 到 `node:20-alpine`

**问题2**: `addgroup: group 'nginx' in use`
- **原因**: nginx:alpine 镜像已包含 nginx 用户和组
- **解决**: 移除重复的用户创建命令，使用现有的 nginx 用户

**问题3**: TypeScript 类型错误
- **原因**: 依赖版本更新导致类型不兼容
- **解决**: 修复类型导入和定义，提供跳过类型检查的构建选项

## 📦 构建要求

### 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存

### Node.js 版本
- **前端**: Node.js 20.19+ (Vite 7.x 要求)
- **后端**: Node.js 20+ (保持一致性)

## 🚀 构建步骤

### 方法1: 生产环境部署 (推荐)

```bash
# 使用生产环境配置（无MySQL容器）
chmod +x deploy-prod.sh
./deploy-prod.sh
```

### 方法2: 开发环境 (包含MySQL容器)

```bash
# 构建所有服务
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方法2: 单独构建

```bash
# 构建后端
cd backend
docker build -t quizonly-backend .

# 构建前端
cd ../frontend
docker build -t quizonly-frontend .
```

### 方法3: 使用测试脚本

```bash
# 运行构建测试
chmod +x test-docker-build.sh
./test-docker-build.sh
```

## 🔍 故障排除

### 常见错误

1. **nest: not found**
   - 确保 `@nestjs/cli` 在 `devDependencies` 中
   - 构建阶段使用 `npm ci` 而不是 `npm ci --only=production`

2. **crypto.hash is not a function**
   - 升级到 Node.js 20+
   - 检查 Vite 版本兼容性

3. **内存不足**
   - 增加 Docker 内存限制
   - 使用 `--max-old-space-size=4096` 参数

### 调试命令

```bash
# 查看构建日志
docker-compose build --no-cache

# 进入容器调试
docker run -it --rm quizonly-backend:latest sh

# 检查 Node.js 版本
docker run --rm node:20-alpine node --version
```

## 📋 验证清单

- [ ] Docker 和 Docker Compose 已安装
- [ ] 使用 Node.js 20+ 镜像
- [ ] 后端构建成功 (nest build 正常)
- [ ] 前端构建成功 (vite build 正常)
- [ ] 所有服务启动正常
- [ ] 健康检查通过

## 🎯 生产部署

### 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑生产配置
vim .env
```

### 安全建议

1. 更改默认密码
2. 使用 HTTPS
3. 配置防火墙
4. 定期备份数据库
5. 监控日志

## 📞 支持

如果遇到构建问题，请检查：
1. Docker 版本是否符合要求
2. 系统内存是否充足
3. 网络连接是否正常
4. 依赖版本是否兼容
