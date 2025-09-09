import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { File } from '../../files/entities/file.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { Question } from './question.entity';

export const QuestionType = {
  MCQ: 'mcq',           // 选择题
  FILL: 'fill',         // 填空题
  SHORT: 'short',       // 简答题
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  stem: string;           // 题干
  options?: string[];     // 选择题选项
  answer: string;         // 正确答案
  explanation?: string;   // 解释
  points: number;         // 分值
  metadata?: Record<string, any>;
}

export const QuizStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type QuizStatus = typeof QuizStatus[keyof typeof QuizStatus];

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  questions: QuizQuestion[];

  @Column({
    type: 'enum',
    enum: QuizStatus,
    default: QuizStatus.DRAFT,
  })
  status: QuizStatus;

  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  @Column({ type: 'int', default: 0 })
  timeLimit: number; // 时间限制（分钟）

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => File, (file) => file.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column()
  fileId: string;

  @OneToMany(() => QuizAttempt, (attempt) => attempt.quiz)
  attempts: QuizAttempt[];

  @OneToMany(() => Question, (question) => question.quiz)
  questionEntities: Question[];

  // 虚拟属性
  get questionCount(): number {
    return this.questionEntities?.length || this.questions?.length || 0;
  }

  get isPublished(): boolean {
    return this.status === QuizStatus.PUBLISHED;
  }

  get isDraft(): boolean {
    return this.status === QuizStatus.DRAFT;
  }

  get averagePoints(): number {
    if (!this.questions?.length) return 0;
    return this.totalPoints / this.questions.length;
  }
}
