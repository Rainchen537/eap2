# QuizOnly - 智能出题平台

一个面向最终用户的智能出题平台，支持文档上传、智能标注、AI出题和在线答题。

## 🚀 当前状态

**✅ MVP版本完全就绪！** - 前后端服务正常运行，数据库连接成功，AI功能可用。

### ✅ 完全就绪
- **前端**: Vue 3应用运行在 http://localhost:5174
- **后端**: NestJS API服务运行在 http://localhost:3000
- **数据库**: 远程数据库 `aiagent` 连接成功，所有表已创建
- **API文档**: Swagger文档可访问 http://localhost:3000/api/docs
- **AI功能**: Mock Provider正常工作，智能回退机制已启用
- **健康检查**: 所有服务状态正常

### 🎯 可用功能
- 用户认证 (注册/登录/JWT)
- 文件上传和处理
- AI标注建议
- AI题目生成
- AI答案评估
- 完整的API接口

## 项目概述

构建一个面向最终用户的智能出题平台。核心功能：

- 用户上传 Word / TXT / Markdown 文件并预览
- 允许用户用两种"荧光笔"标注：排除信息（exclude） 与 出题要点（focus）
- 支持 AI 自动生成这两类标注
- 根据标注由 LLM 自动生成题目（多种题型），并提供答题界面与评分/反馈
- 用户注册/登录、购买套餐、API Key 支持
- 管理员面板：配置套餐、把套餐和不同后端 LLM/API 绑定
- 数据库：MySQL，前端：Vue 3

## 功能特性

- 📄 支持多种文档格式（Word、TXT、Markdown）
- 🎯 智能标注系统（排除信息、出题要点）
- 🤖 AI自动生成题目和标注建议
- 📝 多种题型支持（选择题、填空题、简答题）
- 💰 灵活的套餐和计费系统
- 🔑 支持用户自定义API Key
- 👨‍💼 完整的管理员面板

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite 构建工具
- Pinia 状态管理
- Vue Router 路由
- Element Plus UI组件库

### 后端
- NestJS + TypeScript
- MySQL 数据库
- TypeORM
- JWT 认证
- Swagger API文档

### AI集成
- Google Gemini API
- 支持多LLM Provider
- 可配置的API抽象层

### 部署
- Docker + Docker Compose
- GitHub Actions CI/CD

## 项目结构

```
quizonly/
├── frontend/          # Vue3 前端项目
├── backend/           # NestJS 后端项目
├── database/          # 数据库迁移和种子数据
├── docker/            # Docker配置文件
├── docs/              # 项目文档
└── scripts/           # 构建和部署脚本
```

## 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose (推荐)

### 🚀 一键部署（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd quizonly

# 运行部署脚本
./scripts/deploy.sh
```

部署完成后访问：
- 前端应用: http://localhost
- API文档: http://localhost:3000/api/docs
- 默认管理员: admin@quizonly.com / admin123

### 🛠️ 开发环境设置

```bash
# 设置开发环境
./scripts/dev-setup.sh

# 启动后端开发服务器
cd backend && npm run start:dev

# 启动前端开发服务器（新终端）
cd frontend && npm run dev
```

开发环境地址：
- 前端: http://localhost:5173
- 后端: http://localhost:3000
- 数据库管理: http://localhost:8080

### 📦 手动部署

#### Docker部署（生产环境）
```bash
# 复制环境变量配置
cp .env.example .env
# 编辑 .env 文件配置必要参数

# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 本地开发部署
```bash
# 1. 启动开发数据库
docker-compose -f docker-compose.dev.yml up -d

# 2. 安装后端依赖并启动
cd backend
npm install
cp .env.example .env
npm run start:dev

# 3. 安装前端依赖并启动（新终端）
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📚 详细文档

### API文档
启动后端服务后，访问 `http://localhost:3000/api/docs` 查看完整的Swagger API文档。

### 核心功能模块

#### 1. 文件管理
- 支持 Word (.docx)、Markdown (.md)、纯文本 (.txt) 格式
- 自动解析文档内容为统一的 canonicalText 格式
- 文件上传进度跟踪和状态管理

#### 2. 智能标注系统
- **Focus标注**: 标记需要出题的重点内容
- **Exclude标注**: 标记需要排除的无关信息
- AI自动建议标注，用户可审核和调整
- 支持字符级精确定位

#### 3. AI出题引擎
- **选择题 (MCQ)**: 自动生成4选项选择题
- **填空题 (Fill)**: 基于关键词生成填空题
- **简答题 (Short)**: 生成开放性问答题
- 支持题目编辑和难度调整

#### 4. 答题与评分
- 在线答题界面，支持计时
- 自动评分：选择题和填空题即时评分
- AI辅助评分：简答题智能评分和反馈
- 详细的答题报告和统计分析

#### 5. 用户与套餐管理
- 多层级用户权限管理
- 灵活的套餐配置系统
- 使用量统计和配额管理
- 支持用户自定义API Key

### 技术架构

#### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: MySQL 8.0 + TypeORM
- **认证**: JWT + Refresh Token
- **文档**: Swagger/OpenAPI
- **文件处理**: Mammoth.js (Word), Markdown-it
- **AI集成**: Google Gemini API

#### 前端技术栈
- **框架**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia + 持久化
- **UI组件**: Element Plus
- **路由**: Vue Router 4
- **HTTP客户端**: Axios

#### 部署架构
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **CI/CD**: GitHub Actions
- **监控**: 健康检查 + 日志管理

### 环境变量配置

#### 必需配置
```bash
# 数据库
DB_HOST=localhost
DB_PASSWORD=your-secure-password
DB_DATABASE=eap2

# JWT密钥（生产环境必须修改）
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# AI API密钥（已预配置第三方中转）
GEMINI_API_KEY=sk-quizonly
GEMINI_API_BASE_URL=https://nnhentyqsfgw.ap-northeast-1.clawcloudrun.com
```

#### 可选配置
```bash
# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 支付服务
STRIPE_SECRET_KEY=your-stripe-key

# Redis缓存
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd backend
npm test
npm run test:e2e

# 前端测试
cd frontend
npm test
```

### 测试覆盖率
```bash
cd backend
npm run test:cov
```

## 🚀 生产部署

### 服务器要求
- CPU: 2核心以上
- 内存: 4GB以上
- 存储: 20GB以上
- 操作系统: Ubuntu 20.04+ / CentOS 8+

### 部署步骤
1. 安装Docker和Docker Compose
2. 克隆项目代码
3. 配置环境变量
4. 运行部署脚本
5. 配置域名和SSL证书

### 性能优化
- 启用Nginx Gzip压缩
- 配置静态资源缓存
- 数据库索引优化
- Redis缓存配置

## 🔧 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库服务状态
docker-compose ps mysql

# 查看数据库日志
docker-compose logs mysql
```

#### 2. 文件上传失败
- 检查uploads目录权限
- 确认文件大小限制配置
- 查看后端错误日志

#### 3. AI功能不可用
- 验证API密钥配置
- 检查网络连接
- 查看API调用日志

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🤝 贡献指南

### 开发流程
1. Fork 项目到个人仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交代码: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

### 代码规范
- 使用 ESLint 和 Prettier 格式化代码
- 遵循 TypeScript 严格模式
- 编写单元测试覆盖新功能
- 更新相关文档

### 提交规范
使用 Conventional Commits 格式：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建工具或辅助工具的变动

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目：
- [NestJS](https://nestjs.com/) - 渐进式Node.js框架
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - Vue 3组件库
- [TypeORM](https://typeorm.io/) - TypeScript ORM
- [Google Gemini](https://ai.google.dev/) - AI API服务
