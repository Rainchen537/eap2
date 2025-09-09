#!/usr/bin/env node

const axios = require('axios');

async function testGeminiAPI() {
  console.log('🧪 测试Gemini API配置...');
  
  const apiKey = 'sk-quizonly';
  const baseURL = 'http://45.221.115.62:8088';
  
  try {
    console.log('📡 连接到:', baseURL);
    console.log('🔑 使用API Key:', apiKey);
    
    const response = await axios.post(
      `${baseURL}/v1/models/gemini-pro:generateContent`,
      {
        contents: [{
          parts: [{ text: '请回复"连接成功"' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('✅ API连接成功!');
    console.log('📝 AI回复:', content);
    console.log('📊 使用统计:', response.data.usageMetadata);
    
    return true;
  } catch (error) {
    console.log('❌ API连接失败');
    console.log('🔍 错误详情:');
    
    if (error.response) {
      console.log('   状态码:', error.response.status);
      console.log('   错误信息:', error.response.data);
    } else if (error.request) {
      console.log('   网络错误:', error.message);
    } else {
      console.log('   配置错误:', error.message);
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 EAP2 Gemini API 测试工具\n');
  
  const success = await testGeminiAPI();
  
  console.log('\n📋 测试结果:');
  if (success) {
    console.log('✅ Gemini API配置正确，可以正常使用');
    console.log('💡 提示: 后端服务将自动使用此API配置');
  } else {
    console.log('⚠️  Gemini API不可用，将使用Mock Provider');
    console.log('💡 提示: 开发测试功能不受影响');
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testGeminiAPI };
