import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Provider } from './provider.entity';
import { File } from '../../files/entities/file.entity';

export const ApiCallStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  RATE_LIMITED: 'rate_limited',
} as const;

export type ApiCallStatus = typeof ApiCallStatus[keyof typeof ApiCallStatus];

export const ApiCallType = {
  ANNOTATION: 'annotation',
  QUIZ_GENERATION: 'quiz_generation',
  GRADING: 'grading',
  OTHER: 'other',
} as const;

export type ApiCallType = typeof ApiCallType[keyof typeof ApiCallType];

@Entity('api_calls')
export class ApiCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ApiCallType,
  })
  type: ApiCallType;

  @Column()
  endpoint: string;

  @Column({
    type: 'enum',
    enum: ApiCallStatus,
  })
  status: ApiCallStatus;

  @Column({ type: 'int', nullable: true })
  inputTokens: number;

  @Column({ type: 'int', nullable: true })
  outputTokens: number;

  @Column({ type: 'int', nullable: true })
  totalTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  cost: number;

  @Column({ type: 'int', nullable: true })
  responseTime: number; // 响应时间（毫秒）

  @Column({ type: 'text', nullable: true })
  inputSnippet: string; // 输入内容片段（用于审计）

  @Column({ type: 'text', nullable: true })
  outputSnippet: string; // 输出内容片段

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.apiCalls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Provider, (provider) => provider.apiCalls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @Column()
  providerId: string;

  @ManyToOne(() => File, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column({ nullable: true })
  fileId: string;

  // 虚拟属性
  get isSuccess(): boolean {
    return this.status === ApiCallStatus.SUCCESS;
  }

  get isError(): boolean {
    return this.status === ApiCallStatus.ERROR;
  }

  get isTimeout(): boolean {
    return this.status === ApiCallStatus.TIMEOUT;
  }

  get isRateLimited(): boolean {
    return this.status === ApiCallStatus.RATE_LIMITED;
  }

  get costPerToken(): number {
    if (!this.totalTokens || !this.cost) return 0;
    return this.cost / this.totalTokens;
  }

  get efficiency(): number {
    if (!this.responseTime || !this.totalTokens) return 0;
    return this.totalTokens / (this.responseTime / 1000); // tokens per second
  }
}
