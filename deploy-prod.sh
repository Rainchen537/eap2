#!/bin/bash

# QuizOnly 生产环境部署脚本

echo "🚀 开始部署 QuizOnly 到生产环境..."

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
if [ ! -f ".env.prod" ]; then
    echo "❌ 未找到 .env.prod 文件"
    echo "请复制 .env.prod 模板并配置您的环境变量"
    exit 1
fi

# 复制生产环境配置
echo "📋 使用生产环境配置..."
cp .env.prod .env

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down

# 清理旧镜像（可选）
read -p "是否清理旧的Docker镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
fi

# 构建镜像
echo "🔨 构建应用镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

if [ $? -ne 0 ]; then
    echo "❌ 启动失败"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 检查健康状态
echo "🏥 检查服务健康状态..."
echo "后端健康检查:"
curl -f http://localhost:3000/api/health || echo "后端服务未就绪"

echo "前端健康检查:"
curl -f http://localhost/ || echo "前端服务未就绪"

echo ""
echo "🎉 部署完成！"
echo ""
echo "📊 服务信息:"
echo "- 前端地址: http://localhost"
echo "- 后端API: http://localhost:3000/api"
echo "- API文档: http://localhost:3000/api/docs"
echo "- 管理后台: http://localhost/admin"
echo ""
echo "📋 管理命令:"
echo "- 查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "- 停止服务: docker-compose -f docker-compose.prod.yml down"
echo "- 重启服务: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔐 默认账户:"
echo "- 管理员: admin@quizonly.com / admin123"
echo "- 测试用户: test@example.com / 123456"
