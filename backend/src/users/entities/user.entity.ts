import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { File } from '../../files/entities/file.entity';
import { Annotation } from '../../annotations/entities/annotation.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';
import { QuizAttempt } from '../../quizzes/entities/quiz-attempt.entity';
import { UserPlan } from '../../plans/entities/user-plan.entity';
import { ApiKey } from '../../providers/entities/api-key.entity';
import { ApiCall } from '../../providers/entities/api-call.entity';

export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @OneToMany(() => Annotation, (annotation) => annotation.user)
  annotations: Annotation[];

  @OneToMany(() => Quiz, (quiz) => quiz.user)
  quizzes: Quiz[];

  @OneToMany(() => QuizAttempt, (attempt) => attempt.user)
  quizAttempts: QuizAttempt[];

  @OneToMany(() => UserPlan, (userPlan) => userPlan.user)
  userPlans: UserPlan[];

  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];

  @OneToMany(() => ApiCall, (apiCall) => apiCall.user)
  apiCalls: ApiCall[];

  // 虚拟属性
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
