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
import { Annotation } from '../../annotations/entities/annotation.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';

export const FileStatus = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type FileStatus = typeof FileStatus[keyof typeof FileStatus];

export interface FileBlock {
  blockId: string;
  type: 'paragraph' | 'heading' | 'list' | 'table';
  text: string;
  startOffset: number;
  endOffset: number;
  page?: number;
  meta?: Record<string, any>;
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalFilename: string;

  @Column()
  filename: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  path: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADING,
  })
  status: FileStatus;

  @Column({ type: 'text', nullable: true })
  canonicalText: string;

  @Column({ type: 'json', nullable: true })
  blocks: FileBlock[];

  @Column({ type: 'text', nullable: true })
  processingError: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Annotation, (annotation) => annotation.file)
  annotations: Annotation[];

  @OneToMany(() => Quiz, (quiz) => quiz.file)
  quizzes: Quiz[];

  // 虚拟属性
  get isProcessed(): boolean {
    return this.status === FileStatus.COMPLETED;
  }

  get hasError(): boolean {
    return this.status === FileStatus.FAILED;
  }

  get textLength(): number {
    return this.canonicalText?.length || 0;
  }

  get fileExtension(): string {
    return this.originalFilename.split('.').pop()?.toLowerCase() || '';
  }

  get isWordDocument(): boolean {
    return this.mimeType.includes('wordprocessingml') || this.fileExtension === 'docx';
  }

  get isMarkdown(): boolean {
    return this.mimeType === 'text/markdown' || this.fileExtension === 'md';
  }

  get isTextFile(): boolean {
    return this.mimeType === 'text/plain' || this.fileExtension === 'txt';
  }
}
