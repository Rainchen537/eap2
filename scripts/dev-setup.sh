#!/bin/bash

# EAP2 开发环境设置脚本
set -e

echo "🛠️  设置 EAP2 开发环境..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

# 启动开发数据库
echo "🗄️  启动开发数据库..."
docker-compose -f docker-compose.dev.yml up -d

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 已创建后端环境变量文件，请根据需要修改"
fi
npm install

# 运行数据库迁移
echo "🔄 运行数据库迁移..."
npm run migration:run || echo "⚠️  迁移失败，可能是首次运行"

cd ..

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 已创建前端环境变量文件，请根据需要修改"
fi

# 清理可能存在的依赖冲突
if [ -f package-lock.json ]; then
    echo "🧹 清理旧的依赖锁定文件..."
    rm -f package-lock.json
fi

if [ -d node_modules ]; then
    echo "🧹 清理旧的node_modules..."
    rm -rf node_modules
fi

echo "📦 安装依赖包..."
npm install

cd ..

echo "✅ 开发环境设置完成！"
echo ""
echo "🚀 启动开发服务器："
echo "   后端: cd backend && npm run start:dev"
echo "   前端: cd frontend && npm run dev"
echo ""
echo "🔗 开发环境地址："
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3000"
echo "   API文档: http://localhost:3000/api/docs"
echo "   数据库管理: http://localhost:8080"
echo ""
echo "🗄️  数据库连接信息："
echo "   主机: localhost:3306"
echo "   用户名: root"
echo "   密码: password"
echo "   数据库: eap2"
