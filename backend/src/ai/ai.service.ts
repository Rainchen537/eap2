import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../files/entities/file.entity';
import { Annotation } from '../annotations/entities/annotation.entity';
import { Quiz, QuizStatus, QuestionType } from '../quizzes/entities/quiz.entity';
// import { Question } from '../quizzes/entities/question.entity';
import { ProviderFactory } from '../providers/services/provider.factory';
import { GenerateQuizDto, EvaluateAnswerDto } from './dto';
import { AnnotationSuggestion, QuizQuestion } from '../providers/interfaces/llm-provider.interface';

@Injectable()
export class AIService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    // @InjectRepository(Question)
    // private questionRepository: Repository<Question>,
    private providerFactory: ProviderFactory,
  ) {}

  async suggestAnnotations(fileId: string, userId: string): Promise<AnnotationSuggestion[]> {
    // 验证文件权限
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.status !== 'completed') {
      throw new ForbiddenException('File is not ready for annotation');
    }

    // 获取LLM Provider
    const provider = await this.providerFactory.getProvider();

    // 生成标注建议
    const suggestions = await provider.suggestAnnotations(file.canonicalText);

    return suggestions;
  }

  async generateQuiz(generateQuizDto: GenerateQuizDto, userId: string): Promise<Quiz> {
    // 验证文件权限
    const file = await this.fileRepository.findOne({
      where: { id: generateQuizDto.fileId, userId },
      relations: ['annotations'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // 获取focus标注
    const focusAnnotations = file.annotations.filter(ann => ann.type === 'focus');
    
    if (focusAnnotations.length === 0) {
      throw new ForbiddenException('No focus annotations found. Please add some focus annotations first.');
    }

    // 获取LLM Provider
    const provider = await this.providerFactory.getProvider();

    // 生成题目
    const questions = await provider.generateQuiz({
      content: file.canonicalText,
      annotations: focusAnnotations.map(ann => ({
        type: ann.type as 'focus' | 'exclude',
        text: ann.text,
      })),
      questionTypes: generateQuizDto.questionTypes,
      count: generateQuizDto.count,
      difficulty: generateQuizDto.difficulty,
    });

    // 保存Quiz
    const quiz = this.quizRepository.create({
      title: generateQuizDto.title || `Quiz for ${file.originalFilename}`,
      description: generateQuizDto.description,
      fileId: file.id,
      userId: userId,
      status: QuizStatus.DRAFT,
      questions: questions.map((q, index) => ({
        id: `q_${index + 1}`,
        type: q.type as any,
        stem: q.question,
        options: q.options || [],
        answer: q.correctAnswer,
        explanation: q.explanation,
        points: 10, // 默认分值
        metadata: { difficulty: q.difficulty || generateQuizDto.difficulty || 'medium' }
      })),
      totalPoints: questions.length * 10,
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    return savedQuiz;
  }

  async evaluateAnswer(evaluateAnswerDto: EvaluateAnswerDto, userId: string): Promise<{
    score: number;
    feedback: string;
  }> {
    // 简化版本：直接使用AI评估
    const provider = await this.providerFactory.getProvider();

    const result = await provider.evaluateAnswer(
      evaluateAnswerDto.question || '题目',
      evaluateAnswerDto.correctAnswer || '标准答案',
      evaluateAnswerDto.userAnswer
    );

    return result;
  }

  private getPointsByDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy':
        return 5;
      case 'medium':
        return 10;
      case 'hard':
        return 15;
      default:
        return 10;
    }
  }
}
