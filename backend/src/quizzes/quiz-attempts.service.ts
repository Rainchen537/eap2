import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizAttempt, AttemptStatus, GradingMethod, AttemptAnswer } from './entities/quiz-attempt.entity';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FinishQuizAttemptDto } from './dto/finish-quiz-attempt.dto';

@Injectable()
export class QuizAttemptsService {
  constructor(
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async startQuizAttempt(quizId: string, userId: string): Promise<QuizAttempt> {
    // 检查题目是否存在且已完成
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, userId },
      relations: ['questionEntities'],
    });

    if (!quiz) {
      throw new NotFoundException('题目不存在');
    }

    if (quiz.status !== QuizStatus.COMPLETED) {
      throw new BadRequestException('题目尚未生成完成，无法开始答题');
    }

    // 检查是否已有进行中的答题记录
    const existingAttempt = await this.quizAttemptRepository.findOne({
      where: { 
        quizId, 
        userId, 
        status: AttemptStatus.IN_PROGRESS 
      },
    });

    if (existingAttempt) {
      return existingAttempt;
    }

    // 创建新的答题记录
    const quizAttempt = this.quizAttemptRepository.create({
      quizId,
      userId,
      status: AttemptStatus.IN_PROGRESS,
      answers: [],
      startedAt: new Date(),
    });

    return await this.quizAttemptRepository.save(quizAttempt);
  }

  async submitAnswer(
    attemptId: string, 
    submitAnswerDto: SubmitAnswerDto, 
    userId: string
  ): Promise<QuizAttempt> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId, userId },
      relations: ['quiz', 'quiz.questionEntities'],
    });

    if (!attempt) {
      throw new NotFoundException('答题记录不存在');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('答题已结束，无法提交答案');
    }

    // 查找题目
    const question = await this.questionRepository.findOne({
      where: { id: submitAnswerDto.questionId, quizId: attempt.quizId },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    // 检查答案是否正确
    const isCorrect = this.checkAnswer(question, submitAnswerDto.answer);
    const points = isCorrect ? question.score : 0;

    // 更新或添加答案
    const answers = attempt.answers || [];
    const existingAnswerIndex = answers.findIndex(a => a.questionId === submitAnswerDto.questionId);
    
    const answerData: AttemptAnswer = {
      questionId: submitAnswerDto.questionId,
      answer: submitAnswerDto.answer,
      isCorrect,
      points,
      feedback: isCorrect ? '回答正确' : `正确答案是：${question.correctAnswer}`,
    };

    if (existingAnswerIndex >= 0) {
      answers[existingAnswerIndex] = answerData;
    } else {
      answers.push(answerData);
    }

    attempt.answers = answers;
    
    return await this.quizAttemptRepository.save(attempt);
  }

  async finishQuizAttempt(
    attemptId: string, 
    finishQuizAttemptDto: FinishQuizAttemptDto, 
    userId: string
  ): Promise<QuizAttempt> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id: attemptId, userId },
      relations: ['quiz', 'quiz.questionEntities'],
    });

    if (!attempt) {
      throw new NotFoundException('答题记录不存在');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('答题已结束');
    }

    // 计算总分
    const totalScore = attempt.answers.reduce((sum, answer) => sum + (answer.points || 0), 0);
    const totalPossibleScore = attempt.quiz.totalScore || (attempt.quiz.questionEntities?.length * 10) || 0;
    const percentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;

    // 更新答题记录
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.score = totalScore;
    attempt.totalPoints = totalPossibleScore;
    attempt.percentage = percentage;
    attempt.submittedAt = new Date();
    attempt.timeSpent = finishQuizAttemptDto.timeSpent;
    attempt.gradingMethod = GradingMethod.AUTO;
    attempt.gradedAt = new Date();

    return await this.quizAttemptRepository.save(attempt);
  }

  async findAll(userId: string, quizId?: string): Promise<QuizAttempt[]> {
    const where: any = { userId };
    if (quizId) {
      where.quizId = quizId;
    }

    return await this.quizAttemptRepository.find({
      where,
      relations: ['quiz'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<QuizAttempt> {
    const attempt = await this.quizAttemptRepository.findOne({
      where: { id, userId },
      relations: ['quiz', 'quiz.questionEntities', 'quiz.file'],
    });

    if (!attempt) {
      throw new NotFoundException('答题记录不存在');
    }

    return attempt;
  }

  private checkAnswer(question: Question, userAnswer: string): boolean {
    // 简单的答案检查逻辑
    const correctAnswer = question.correctAnswer.trim().toLowerCase();
    const answer = userAnswer.trim().toLowerCase();
    
    if (question.type === 'mcq') {
      // 选择题：精确匹配
      return correctAnswer === answer;
    } else if (question.type === 'fill_blank') {
      // 填空题：包含关键词即可
      return correctAnswer.includes(answer) || answer.includes(correctAnswer);
    } else {
      // 简答题：包含关键词即可（实际应该用AI评分）
      return correctAnswer.includes(answer) || answer.includes(correctAnswer);
    }
  }
}
