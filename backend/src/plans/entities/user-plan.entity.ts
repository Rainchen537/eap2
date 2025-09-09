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
import { Plan } from './plan.entity';

export const UserPlanStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended',
} as const;

export type UserPlanStatus = typeof UserPlanStatus[keyof typeof UserPlanStatus];

@Entity('user_plans')
export class UserPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  endAt: Date;

  @Column({ type: 'int', default: 0 })
  remainingQuota: number;

  @Column({ type: 'int', default: 0 })
  usedQuota: number;

  @Column({
    type: 'enum',
    enum: UserPlanStatus,
    default: UserPlanStatus.ACTIVE,
  })
  status: UserPlanStatus;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.userPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Plan, (plan) => plan.userPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column()
  planId: string;

  // 虚拟属性
  get isActive(): boolean {
    const now = new Date();
    return (
      this.status === UserPlanStatus.ACTIVE &&
      this.startAt <= now &&
      this.endAt > now
    );
  }

  get isExpired(): boolean {
    return this.endAt < new Date() || this.status === UserPlanStatus.EXPIRED;
  }

  get isCancelled(): boolean {
    return this.status === UserPlanStatus.CANCELLED;
  }

  get daysRemaining(): number {
    const now = new Date();
    const diffTime = this.endAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get quotaUsagePercentage(): number {
    const totalQuota = this.remainingQuota + this.usedQuota;
    if (totalQuota === 0) return 0;
    return (this.usedQuota / totalQuota) * 100;
  }
}
