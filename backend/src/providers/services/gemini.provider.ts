import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
  LLMResponse,
  AnnotationSuggestion,
  QuizQuestion,
  QuizGenerationRequest,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider extends LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly httpClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    const config: LLMProviderConfig = {
      apiKey: configService.get<string>('GEMINI_API_KEY'),
      baseUrl: configService.get<string>('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com'),
      model: configService.get<string>('GEMINI_MODEL', 'gemini-pro'),
      maxTokens: 4096,
      temperature: 0.7,
      timeout: 30000,
    };

    super(config);

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
  }

  async generateCompletion(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const prompt = this.formatMessages(messages);

      const response = await this.httpClient.post(`/v1/models/${this.config.model}:generateContent`, {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
        }
      });

      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usage = response.data.usageMetadata;

      return {
        content,
        usage: usage ? {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        } : undefined,
        model: this.config.model,
      };
    } catch (error) {
      this.logger.error('Failed to generate completion', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (error.response?.status === 503) {
        throw new Error('Gemini API服务暂时不可用，请稍后重试');
      } else if (error.response?.status === 401) {
        throw new Error('Gemini API认证失败，请检查API密钥');
      } else if (error.response?.status === 429) {
        throw new Error('Gemini API请求频率超限，请稍后重试');
      } else {
        throw new Error(`Gemini API错误: ${error.message}`);
      }
    }
  }

  async suggestAnnotations(content: string): Promise<AnnotationSuggestion[]> {
    const prompt = `
请分析以下文档内容，识别出适合出题的重点内容（focus）和应该排除的无关信息（exclude）。

文档内容：
${content}

请以JSON格式返回标注建议，格式如下：
{
  "annotations": [
    {
      "type": "focus",
      "text": "具体的文本内容",
      "startOffset": 起始位置,
      "endOffset": 结束位置,
      "confidence": 0.95,
      "reason": "标注原因"
    }
  ]
}

注意：
1. focus标注应该标记重要概念、定义、关键信息等适合出题的内容
2. exclude标注应该标记联系方式、无关信息、格式标记等不适合出题的内容
3. 确保startOffset和endOffset准确对应文本位置
4. confidence表示标注的置信度（0-1之间）
`;

    try {
      const response = await this.generateCompletion([
        { role: 'user', content: prompt }
      ]);

      const result = JSON.parse(response.content);
      return result.annotations || [];
    } catch (error) {
      this.logger.error('Failed to suggest annotations', error);
      return [];
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<QuizQuestion[]> {
    const focusContent = request.annotations
      .filter(ann => ann.type === 'focus')
      .map(ann => ann.text)
      .join('\n');

    const prompt = `
基于以下重点内容生成${request.count}道题目：

重点内容：
${focusContent}

要求：
1. 题目类型：${request.questionTypes.join('、')}
2. 难度：${request.difficulty || 'medium'}
3. 每种类型的题目数量尽量平均分配

题目类型说明：
- mcq: 选择题（4个选项，A/B/C/D）
- fill: 填空题（在句子中留空）
- short: 简答题（需要简短回答）

请以JSON格式返回，格式如下：
{
  "questions": [
    {
      "type": "mcq",
      "question": "题目内容",
      "options": ["A选项", "B选项", "C选项", "D选项"],
      "correctAnswer": "A",
      "explanation": "答案解释",
      "difficulty": "medium"
    },
    {
      "type": "fill",
      "question": "这是一个___题目",
      "correctAnswer": "填空",
      "explanation": "答案解释",
      "difficulty": "medium"
    },
    {
      "type": "short",
      "question": "简答题内容",
      "correctAnswer": "参考答案",
      "explanation": "答案要点",
      "difficulty": "medium"
    }
  ]
}
`;

    try {
      const response = await this.generateCompletion([
        { role: 'user', content: prompt }
      ]);

      const result = JSON.parse(response.content);
      return result.questions || [];
    } catch (error) {
      this.logger.error('Failed to generate quiz', error);
      return [];
    }
  }

  async evaluateAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{
    score: number;
    feedback: string;
  }> {
    const prompt = `
请评估以下答题情况：

题目：${question}
标准答案：${correctAnswer}
用户答案：${userAnswer}

请给出评分（0-100分）和详细反馈，以JSON格式返回：
{
  "score": 85,
  "feedback": "详细的评价和建议"
}

评分标准：
- 完全正确：90-100分
- 基本正确但有小错误：70-89分
- 部分正确：50-69分
- 基本错误但有相关内容：20-49分
- 完全错误：0-19分
`;

    try {
      const response = await this.generateCompletion([
        { role: 'user', content: prompt }
      ]);

      const result = JSON.parse(response.content);
      return {
        score: result.score || 0,
        feedback: result.feedback || '无法评估答案',
      };
    } catch (error) {
      this.logger.error('Failed to evaluate answer', error);
      return {
        score: 0,
        feedback: '评估失败，请重试',
      };
    }
  }

  private formatMessages(messages: LLMMessage[]): string {
    return messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  }
}
