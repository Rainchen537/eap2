import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Quiz } from './quiz.entity';

export interface AttemptAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  points?: number;
  feedback?: string;
}

export const AttemptStatus = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
} as const;

export type AttemptStatus = typeof AttemptStatus[keyof typeof AttemptStatus];

export const GradingMethod = {
  AUTO: 'auto',
  MANUAL: 'manual',
  AI_ASSISTED: 'ai_assisted',
} as const;

export type GradingMethod = typeof GradingMethod[keyof typeof GradingMethod];

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  answers: AttemptAnswer[];

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS,
  })
  status: AttemptStatus;

  @Column({ type: 'float', nullable: true })
  score: number;

  @Column({ type: 'int', nullable: true })
  totalPoints: number;

  @Column({ type: 'float', nullable: true })
  percentage: number;

  @Column({
    type: 'enum',
    enum: GradingMethod,
    nullable: true,
  })
  gradingMethod: GradingMethod;

  @Column({ nullable: true })
  gradedBy: string; // 评分者ID

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @Column({ type: 'int', nullable: true })
  timeSpent: number; // 用时（秒）

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.quizAttempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  // 虚拟属性
  get isCompleted(): boolean {
    return this.status === AttemptStatus.SUBMITTED || this.status === AttemptStatus.GRADED;
  }

  get isGraded(): boolean {
    return this.status === AttemptStatus.GRADED;
  }

  get correctAnswers(): number {
    return this.answers?.filter(answer => answer.isCorrect).length || 0;
  }

  get totalQuestions(): number {
    return this.answers?.length || 0;
  }

  get accuracy(): number {
    if (!this.totalQuestions) return 0;
    return (this.correctAnswers / this.totalQuestions) * 100;
  }
}
