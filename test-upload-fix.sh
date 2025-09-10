#!/bin/bash

# 测试文件上传修复脚本

echo "🔧 测试文件上传修复..."

# 检查Docker是否运行
if ! docker ps &> /dev/null; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "📦 重新构建前端镜像（包含修复）..."
cd frontend
docker build -t quizonly-frontend:test .

if [ $? -ne 0 ]; then
    echo "❌ 前端镜像构建失败"
    exit 1
fi

echo "✅ 前端镜像构建成功"

echo "📦 重新构建后端镜像..."
cd ../backend
docker build -t quizonly-backend:test .

if [ $? -ne 0 ]; then
    echo "❌ 后端镜像构建失败"
    exit 1
fi

echo "✅ 后端镜像构建成功"

echo "🚀 启动测试容器..."
cd ..

# 停止现有容器
docker-compose -f docker-compose.prod.yml down

# 使用测试镜像启动
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ 等待服务启动..."
sleep 30

echo "🔍 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

echo "🏥 检查服务健康状态..."
echo "后端健康检查:"
curl -f http://localhost:3000/api/health || echo "后端服务未就绪"

echo "前端健康检查:"
curl -f http://localhost/ || echo "前端服务未就绪"

echo "📋 Nginx 配置验证:"
docker exec quizonly-frontend nginx -t

echo "🎉 测试完成！"
echo ""
echo "📝 修复内容："
echo "1. ✅ 修复了前端 API 基础 URL 配置"
echo "2. ✅ 优化了 Nginx 文件上传代理配置"
echo "3. ✅ 增加了文件上传专用的 Nginx 配置"
echo "4. ✅ 设置了正确的环境变量"
echo ""
echo "🌐 访问地址："
echo "前端: http://localhost"
echo "后端API: http://localhost:3000/api"
echo ""
echo "📤 现在可以测试文件上传功能了！"
