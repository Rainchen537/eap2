import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Provider } from './provider.entity';

export const ApiKeyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export type ApiKeyStatus = typeof ApiKeyStatus[keyof typeof ApiKeyStatus];

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  keyEncrypted: string; // 加密存储的API Key

  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', nullable: true })
  usageLimit: number; // 使用次数限制

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Provider, (provider) => provider.apiKeys, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @Column()
  providerId: string;

  // 虚拟属性
  get isActive(): boolean {
    const now = new Date();
    return (
      this.status === ApiKeyStatus.ACTIVE &&
      (!this.expiresAt || this.expiresAt > now) &&
      (!this.usageLimit || this.usageCount < this.usageLimit)
    );
  }

  get isExpired(): boolean {
    return this.expiresAt && this.expiresAt < new Date();
  }

  get isRevoked(): boolean {
    return this.status === ApiKeyStatus.REVOKED;
  }

  get usagePercentage(): number {
    if (!this.usageLimit) return 0;
    return (this.usageCount / this.usageLimit) * 100;
  }

  get daysUntilExpiry(): number {
    if (!this.expiresAt) return Infinity;
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
