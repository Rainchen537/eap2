import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz, QuizStatus } from './entities/quiz.entity';
import { Question, QuestionType, QuestionDifficulty } from './entities/question.entity';
import { File } from '../files/entities/file.entity';
import { Annotation, AnnotationType } from '../annotations/entities/annotation.entity';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { ProvidersService } from '../providers/providers.service';
import { fixChineseFilename } from '../utils/encoding.util';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
    private providersService: ProvidersService,
  ) {}

  async generateQuiz(generateQuizDto: GenerateQuizDto, userId: string): Promise<Quiz> {
    const { fileId, questionCount, questionType, difficulty = 'medium', title, description } = generateQuizDto;

    // 验证文件存在
    const file = await this.fileRepository.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    // 获取Focus标注内容
    const focusAnnotations = await this.annotationRepository.find({
      where: { fileId, userId, type: AnnotationType.FOCUS },
      order: { startOffset: 'ASC' },
    });

    // 如果没有标注，将使用全文内容生成题目
    let contentForGeneration = '';
    let descriptionSuffix = '';

    if (focusAnnotations.length === 0) {
      // 使用全文内容
      contentForGeneration = file.canonicalText;
      descriptionSuffix = '基于文档全文内容生成';
      console.log('没有找到标注，将使用全文内容生成题目');
    } else {
      // 使用标注内容
      contentForGeneration = focusAnnotations.map(a => a.text).join('\n\n');
      descriptionSuffix = '基于文档标注内容生成';
      console.log(`找到${focusAnnotations.length}个标注，将使用标注内容生成题目`);
    }

    // 生成题目类型的中文描述
    const questionTypeMap = {
      'mcq': '单选题',
      'fill_blank': '填空题',
      'short_answer': '简答题'
    };

    // 修复文件名编码问题
    const fixedFilename = fixChineseFilename(file.originalFilename);

    // 创建题目集，使用自定义标题或默认标题
    const quiz = this.quizRepository.create({
      title: title || `${fixedFilename} - 自动生成题目`,
      description: description || `${descriptionSuffix}的${questionCount}道${questionTypeMap[questionType]}`,
      fileId,
      userId,
      status: QuizStatus.GENERATING,
      questionCount: 0,
      totalScore: 0,
    });

    const savedQuiz = await this.quizRepository.save(quiz);

    // 异步生成题目
    this.generateQuestionsAsync(savedQuiz.id, contentForGeneration, questionCount, questionType, difficulty);

    return savedQuiz;
  }

  private async generateQuestionsAsync(
    quizId: string,
    content: string,
    questionCount: number,
    questionType: string,
    difficulty: string,
  ) {
    try {
      const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
      if (!quiz) return;

      // 使用传入的内容（可能是标注内容或全文内容）
      const focusContent = content;

      // 构建AI提示词
      const prompt = this.buildPrompt(focusContent, questionCount, questionType, difficulty);

      // 调用AI生成题目
      console.log('开始调用AI生成题目...');
      const aiResponse = await this.providersService.generateContent(prompt);
      console.log('AI响应:', aiResponse);

      // 解析AI响应
      const questions = this.parseAIResponse(aiResponse, questionType);
      console.log('解析后的题目数量:', questions.length);

      // 保存题目
      const savedQuestions = [];
      console.log('开始保存题目，题目数量:', Math.min(questions.length, questionCount));

      for (let i = 0; i < Math.min(questions.length, questionCount); i++) {
        const questionData = questions[i];
        console.log(`保存第${i + 1}题:`, questionData);

        const question = this.questionRepository.create({
          quizId,
          type: questionType === 'mcq' ? QuestionType.MCQ : QuestionType.FILL_BLANK,
          difficulty: difficulty === 'easy' ? QuestionDifficulty.EASY :
                     difficulty === 'hard' ? QuestionDifficulty.HARD : QuestionDifficulty.MEDIUM,
          question: questionData.question,
          options: questionData.options || [],
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation || '',
          score: 10, // 每题10分
          order: i + 1,
        });

        const savedQuestion = await this.questionRepository.save(question);
        console.log(`第${i + 1}题保存成功，ID:`, savedQuestion.id);
        savedQuestions.push(savedQuestion);
      }

      // 更新题目集状态和题目数据
      console.log('更新题目集状态为完成，保存的题目数量:', savedQuestions.length);
      quiz.status = QuizStatus.COMPLETED;
      quiz.totalScore = savedQuestions.length * 10;

      // 同时更新JSON字段中的题目数据，供前端直接使用
      quiz.questions = savedQuestions.map((q, index) => ({
        id: q.id,
        type: q.type,
        stem: q.question,
        options: q.options || [],
        answer: q.correctAnswer,
        explanation: q.explanation,
        points: q.score,
        metadata: { difficulty: q.difficulty, order: q.order }
      }));

      await this.quizRepository.save(quiz);
      console.log('题目集更新完成，JSON题目数据已同步');

    } catch (error) {
      console.error('生成题目失败:', error);

      // 更新为失败状态
      const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
      if (quiz) {
        quiz.status = QuizStatus.FAILED;
        await this.quizRepository.save(quiz);
      }
    }
  }

  private buildPrompt(content: string, questionCount: number, questionType: string, difficulty: string): string {
    const difficultyMap = {
      easy: '简单',
      medium: '中等',
      hard: '困难'
    };

    const typeMap = {
      mcq: '单选题',
      fill_blank: '填空题',
      short_answer: '简答题'
    };

    return `请基于以下内容生成${questionCount}道${difficultyMap[difficulty]}难度的${typeMap[questionType]}：

内容：
${content}

要求：
1. 题目应该测试对内容的理解和记忆
2. ${questionType === 'mcq' ? '每题提供4个选项，只有一个正确答案' : ''}
3. 提供简洁的解释说明
4. 返回JSON格式，包含question、${questionType === 'mcq' ? 'options、' : ''}correctAnswer、explanation字段

请返回JSON数组格式的题目。`;
  }

  private parseAIResponse(response: string, questionType: string): any[] {
    try {
      // 尝试解析JSON
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const questions = JSON.parse(cleanResponse);

      if (Array.isArray(questions)) {
        return questions;
      } else if (questions.questions && Array.isArray(questions.questions)) {
        return questions.questions;
      }

      return [];
    } catch (error) {
      console.error('解析AI响应失败:', error);

      // 如果JSON解析失败，尝试简单的文本解析
      return this.parseTextResponse(response, questionType);
    }
  }

  private parseTextResponse(response: string, questionType: string): any[] {
    // 简单的文本解析逻辑
    const questions = [];
    const lines = response.split('\n').filter(line => line.trim());

    let currentQuestion = null;

    for (const line of lines) {
      if (line.match(/^\d+[\.、]/)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question: line.replace(/^\d+[\.、]\s*/, ''),
          options: [],
          correctAnswer: '',
          explanation: ''
        };
      } else if (currentQuestion && questionType === 'mcq' && line.match(/^[A-D][\.、]/)) {
        currentQuestion.options.push(line.replace(/^[A-D][\.、]\s*/, ''));
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  }

  async findAll(userId: string, fileId?: string): Promise<Quiz[]> {
    const where: any = { userId };
    if (fileId) {
      where.fileId = fileId;
    }

    return await this.quizRepository.find({
      where,
      relations: ['file', 'questionEntities'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Quiz> {
    const quiz = await this.quizRepository.findOne({
      where: { id, userId },
      relations: ['file', 'questionEntities'],
    });

    if (!quiz) {
      throw new NotFoundException('题目不存在');
    }

    return quiz;
  }

  async update(id: string, updateQuizDto: UpdateQuizDto, userId: string): Promise<Quiz> {
    const quiz = await this.findOne(id, userId);

    Object.assign(quiz, updateQuizDto);
    return await this.quizRepository.save(quiz);
  }

  async remove(id: string, userId: string): Promise<void> {
    const quiz = await this.findOne(id, userId);
    await this.quizRepository.remove(quiz);
  }
}
