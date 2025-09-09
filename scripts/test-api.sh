#!/bin/bash

# 测试API配置脚本
echo "🧪 测试EAP2 API配置..."

# 检查后端是否启动
echo "📡 检查后端服务..."
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务未启动，请先启动后端服务"
    echo "   cd backend && npm run start:dev"
    exit 1
fi

# 测试AI服务
echo "🤖 测试AI服务..."
AI_RESPONSE=$(curl -s http://localhost:3000/api/health/ai)
AI_STATUS=$(echo $AI_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$AI_STATUS" = "ok" ]; then
    echo "✅ AI服务正常"
    echo "   Provider状态: $(echo $AI_RESPONSE | grep -o '"provider":"[^"]*"' | cut -d'"' -f4)"
else
    echo "⚠️  AI服务降级运行"
    echo "   错误信息: $(echo $AI_RESPONSE | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
    echo "   使用Mock Provider进行开发测试"
fi

echo ""
echo "🔗 可用的API端点:"
echo "   健康检查: http://localhost:3000/api/health"
echo "   AI健康检查: http://localhost:3000/api/health/ai"
echo "   API文档: http://localhost:3000/api/docs"
echo ""
echo "📝 如需测试AI功能，请确保:"
echo "   1. GEMINI_API_KEY 配置正确"
echo "   2. GEMINI_API_BASE_URL 可访问"
echo "   3. 网络连接正常"
