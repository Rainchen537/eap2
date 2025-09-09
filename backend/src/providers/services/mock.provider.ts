import { Injectable, Logger } from '@nestjs/common';
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
export class MockProvider extends LLMProvider {
  private readonly logger = new Logger(MockProvider.name);

  constructor() {
    const config: LLMProviderConfig = {
      apiKey: 'mock-key',
      model: 'mock-model',
    };
    super(config);
  }

  async generateCompletion(messages: LLMMessage[]): Promise<LLMResponse> {
    this.logger.log('Mock completion generation');
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      content: '这是一个模拟的AI响应。在实际环境中，这里会是真实的AI生成内容。',
      usage: {
        promptTokens: 50,
        completionTokens: 30,
        totalTokens: 80,
      },
      model: 'mock-model',
    };
  }

  async suggestAnnotations(content: string): Promise<AnnotationSuggestion[]> {
    this.logger.log('Mock annotation suggestions');
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 生成一些模拟的标注建议
    const suggestions: AnnotationSuggestion[] = [];
    
    // 查找一些常见的模式来生成focus标注
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    
    sentences.slice(0, 3).forEach((sentence, index) => {
      const startOffset = content.indexOf(sentence.trim());
      if (startOffset !== -1) {
        suggestions.push({
          type: 'focus',
          text: sentence.trim(),
          startOffset,
          endOffset: startOffset + sentence.trim().length,
          confidence: 0.8 + Math.random() * 0.2,
          reason: '这段内容包含重要信息，适合出题',
        });
      }
    });
    
    // 生成一些exclude标注
    const excludePatterns = ['联系', '电话', '邮箱', '地址', '版权'];
    excludePatterns.forEach(pattern => {
      const index = content.indexOf(pattern);
      if (index !== -1) {
        const endIndex = Math.min(index + 20, content.length);
        suggestions.push({
          type: 'exclude',
          text: content.substring(index, endIndex),
          startOffset: index,
          endOffset: endIndex,
          confidence: 0.9,
          reason: '这是联系信息或无关内容，不适合出题',
        });
      }
    });
    
    return suggestions;
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<QuizQuestion[]> {
    this.logger.log('Mock quiz generation');
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const questions: QuizQuestion[] = [];
    const { questionTypes, count } = request;
    
    // 平均分配题目类型
    const typesCount = questionTypes.length;
    const questionsPerType = Math.floor(count / typesCount);
    const remainder = count % typesCount;
    
    questionTypes.forEach((type, index) => {
      const typeCount = questionsPerType + (index < remainder ? 1 : 0);
      
      for (let i = 0; i < typeCount; i++) {
        switch (type) {
          case 'mcq':
            questions.push({
              type: 'mcq',
              question: `这是第${questions.length + 1}道选择题，基于文档内容生成的问题？`,
              options: ['选项A', '选项B', '选项C', '选项D'],
              correctAnswer: 'A',
              explanation: '这是选择题的解释说明',
              difficulty: request.difficulty || 'medium',
            });
            break;
            
          case 'fill':
            questions.push({
              type: 'fill',
              question: `这是第${questions.length + 1}道填空题，请填入正确的___。`,
              correctAnswer: '答案',
              explanation: '这是填空题的解释说明',
              difficulty: request.difficulty || 'medium',
            });
            break;
            
          case 'short':
            questions.push({
              type: 'short',
              question: `这是第${questions.length + 1}道简答题，请简要回答相关问题。`,
              correctAnswer: '这是简答题的参考答案',
              explanation: '这是简答题的评分要点',
              difficulty: request.difficulty || 'medium',
            });
            break;
        }
      }
    });
    
    return questions;
  }

  async evaluateAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{
    score: number;
    feedback: string;
  }> {
    this.logger.log('Mock answer evaluation');
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 简单的模拟评分逻辑
    const similarity = this.calculateSimilarity(correctAnswer.toLowerCase(), userAnswer.toLowerCase());
    const score = Math.round(similarity * 100);
    
    let feedback = '';
    if (score >= 90) {
      feedback = '答案非常准确，表现优秀！';
    } else if (score >= 70) {
      feedback = '答案基本正确，但还有改进空间。';
    } else if (score >= 50) {
      feedback = '答案部分正确，建议重新学习相关内容。';
    } else {
      feedback = '答案不够准确，请仔细复习相关知识点。';
    }
    
    return { score, feedback };
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    // 简单的相似度计算
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}
