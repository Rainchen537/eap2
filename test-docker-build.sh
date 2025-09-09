#!/bin/bash

# QuizOnly Docker构建测试脚本

echo "🚀 开始测试 QuizOnly Docker 构建..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

echo "📦 测试后端构建..."
cd backend
echo "使用 Node.js 20 构建后端..."
if docker build -t quizonly-backend:test .; then
    echo "✅ 后端构建成功"
else
    echo "❌ 后端构建失败"
    echo "请检查构建日志以获取详细错误信息"
    exit 1
fi

echo "📦 测试前端构建..."
cd ../frontend
echo "使用 Node.js 20 构建前端..."
if docker build -t quizonly-frontend:test .; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    echo "请检查构建日志以获取详细错误信息"
    exit 1
fi

echo "🎉 所有构建测试通过！"

# 清理测试镜像
echo "🧹 清理测试镜像..."
docker rmi quizonly-backend:test quizonly-frontend:test

echo "✨ 测试完成！"
