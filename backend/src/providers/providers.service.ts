import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ProvidersService {
  constructor(private configService: ConfigService) {}

  async generateContent(prompt: string): Promise<string> {
    console.log('开始调用AI生成题目...');
    console.log('AI生成题目请求:', prompt);

    try {
      const apiKey = this.configService.get('GEMINI_API_KEY');
      const baseUrl = this.configService.get('GEMINI_API_BASE_URL');
      const model = this.configService.get('GEMINI_MODEL', 'gemini-pro');

      console.log('API配置:', {
        apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
        baseUrl,
        model
      });

      if (!apiKey) {
        throw new HttpException('GEMINI_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!baseUrl) {
        throw new HttpException('GEMINI_API_BASE_URL not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // 构建完整的API URL，确保没有双斜杠
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const apiUrl = `${cleanBaseUrl}/v1/chat/completions`;
      console.log('调用API URL:', apiUrl);

      const response = await axios.post(
        apiUrl,
        {
          model: model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 30000
        }
      );

      console.log('AI API响应状态:', response.status);
      console.log('AI API响应数据:', JSON.stringify(response.data, null, 2));

      if (response.data?.choices?.[0]?.message?.content) {
        const aiResponse = response.data.choices[0].message.content;
        console.log('AI生成的内容:', aiResponse);
        return aiResponse;
      } else {
        console.error('AI响应格式错误:', response.data);
        throw new HttpException('AI响应格式错误', HttpStatus.INTERNAL_SERVER_ERROR);
      }

    } catch (error) {
      console.error('AI调用失败:', error.message);
      if (error.response) {
        console.error('AI API错误响应:', error.response.data);
        throw new HttpException(`AI API调用失败: ${error.response.data?.error?.message || error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw new HttpException(`AI调用失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private extractQuestionCount(prompt: string): number {
    const match = prompt.match(/(\d+)道/);
    return match ? parseInt(match[1]) : 2;
  }
}
