#!/bin/bash

# EAP2 部署脚本
set -e

echo "🚀 开始部署 EAP2 文档精炼与出题平台..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置必要的环境变量（如API密钥等）"
    echo "⚠️  特别是以下变量："
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo "   - GEMINI_API_KEY (已预配置第三方中转)"
    echo "   - GEMINI_API_BASE_URL (已预配置第三方中转)"
    echo "   - DB_PASSWORD"
    read -p "配置完成后按回车继续..."
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down

# 清理旧镜像（可选）
read -p "是否清理旧的Docker镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
fi

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🏥 检查服务健康状态..."
for i in {1..30}; do
    if docker-compose exec -T backend node healthcheck.js &> /dev/null; then
        echo "✅ 后端服务健康"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 后端服务启动失败"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

for i in {1..30}; do
    if curl -f http://localhost/health &> /dev/null; then
        echo "✅ 前端服务健康"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ 前端服务启动失败"
        docker-compose logs frontend
        exit 1
    fi
    sleep 2
done

echo "🎉 部署完成！"
echo ""
echo "📱 应用访问地址："
echo "   前端: http://localhost"
echo "   后端API: http://localhost:3000/api"
echo "   API文档: http://localhost:3000/api/docs"
echo "   数据库管理: http://localhost:8080 (仅开发环境)"
echo ""
echo "👤 默认管理员账号："
echo "   邮箱: admin@eap2.com"
echo "   密码: admin123"
echo ""
echo "📋 常用命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo "   进入容器: docker-compose exec [service] sh"
echo "   测试API: ./scripts/test-api.sh"
echo ""
echo "🤖 AI功能说明："
echo "   - 已配置第三方Gemini API中转服务"
echo "   - 如API不可用会自动使用Mock Provider"
echo "   - 可通过 /api/health/ai 检查AI服务状态"
