import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserPlan } from './user-plan.entity';
import { Provider } from '../../providers/entities/provider.entity';

export const PlanType = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export type PlanType = typeof PlanType[keyof typeof PlanType];

export const PlanStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEPRECATED: 'deprecated',
} as const;

export type PlanStatus = typeof PlanStatus[keyof typeof PlanStatus];

export interface PlanFeatures {
  maxFiles: number;
  maxFileSize: number; // MB
  maxAnnotations: number;
  maxQuizzes: number;
  maxQuestions: number;
  aiAnnotations: boolean;
  aiQuizGeneration: boolean;
  customApiKeys: boolean;
  prioritySupport: boolean;
  exportFeatures: boolean;
  advancedAnalytics: boolean;
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  type: PlanType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 30 })
  billingCycle: number; // 计费周期（天）

  @Column({ type: 'int', default: 0 })
  monthlyQuota: number; // 月度配额（API调用次数）

  @Column({ type: 'json' })
  features: PlanFeatures;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => Provider, { nullable: true })
  @JoinColumn({ name: 'defaultProviderId' })
  defaultProvider: Provider;

  @Column({ nullable: true })
  defaultProviderId: string;

  @OneToMany(() => UserPlan, (userPlan) => userPlan.plan)
  userPlans: UserPlan[];

  // 虚拟属性
  get isFree(): boolean {
    return this.type === PlanType.FREE || this.price === 0;
  }

  get isActive(): boolean {
    return this.status === PlanStatus.ACTIVE;
  }

  get monthlyPrice(): number {
    return (this.price * 30) / this.billingCycle;
  }

  get yearlyPrice(): number {
    return this.monthlyPrice * 12;
  }
}
