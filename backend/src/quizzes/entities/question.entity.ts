import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';

export const QuestionType = {
  MCQ: 'mcq',
  FILL_BLANK: 'fill_blank',
  SHORT_ANSWER: 'short_answer',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export const QuestionDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type QuestionDifficulty = typeof QuestionDifficulty[keyof typeof QuestionDifficulty];

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quizId: string;

  @ManyToOne(() => Quiz, quiz => quiz.questionEntities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type: QuestionType;

  @Column('text')
  question: string;

  @Column('json', { nullable: true })
  options: string[];

  @Column('text')
  correctAnswer: string;

  @Column('text', { nullable: true })
  explanation: string;

  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty;

  @Column({ type: 'int', default: 10 })
  score: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
