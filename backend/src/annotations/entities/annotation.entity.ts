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
import { File } from '../../files/entities/file.entity';

export const AnnotationType = {
  FOCUS: 'focus',
  EXCLUDE: 'exclude',
} as const;

export type AnnotationType = typeof AnnotationType[keyof typeof AnnotationType];

export const AnnotationSource = {
  MANUAL: 'manual',
  AI_SUGGESTED: 'ai_suggested',
} as const;

export type AnnotationSource = typeof AnnotationSource[keyof typeof AnnotationSource];

@Entity('annotations')
export class Annotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AnnotationType,
  })
  type: AnnotationType;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'int' })
  startOffset: number;

  @Column({ type: 'int' })
  endOffset: number;

  @Column({
    type: 'enum',
    enum: AnnotationSource,
    default: AnnotationSource.MANUAL,
  })
  source: AnnotationSource;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.annotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => File, (file) => file.annotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column()
  fileId: string;

  // 虚拟属性
  get length(): number {
    return this.endOffset - this.startOffset;
  }

  get isFocus(): boolean {
    return this.type === AnnotationType.FOCUS;
  }

  get isExclude(): boolean {
    return this.type === AnnotationType.EXCLUDE;
  }

  get isAiGenerated(): boolean {
    return this.source === AnnotationSource.AI_SUGGESTED;
  }

  get isManual(): boolean {
    return this.source === AnnotationSource.MANUAL;
  }
}
