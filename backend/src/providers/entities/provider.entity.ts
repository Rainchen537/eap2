import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiKey } from './api-key.entity';
import { ApiCall } from './api-call.entity';

export const ProviderType = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  AZURE: 'azure',
  CLAUDE: 'claude',
  LOCAL: 'local',
  MOCK: 'mock',
} as const;

export type ProviderType = typeof ProviderType[keyof typeof ProviderType];

export const ProviderStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

export type ProviderStatus = typeof ProviderStatus[keyof typeof ProviderStatus];

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  rateLimit?: {
    requests: number;
    window: number; // 时间窗口（秒）
  };
  pricing?: {
    inputTokens: number;  // 每1000个输入token的价格
    outputTokens: number; // 每1000个输出token的价格
  };
}

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProviderType,
  })
  type: ProviderType;

  @Column({ type: 'json' })
  config: ProviderConfig;

  @Column({
    type: 'enum',
    enum: ProviderStatus,
    default: ProviderStatus.ACTIVE,
  })
  status: ProviderStatus;

  @Column({ type: 'int', default: 0 })
  priority: number; // 优先级，数字越大优先级越高

  @Column({ type: 'boolean', default: true })
  isDefault: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => ApiKey, (apiKey) => apiKey.provider)
  apiKeys: ApiKey[];

  @OneToMany(() => ApiCall, (apiCall) => apiCall.provider)
  apiCalls: ApiCall[];

  // 虚拟属性
  get isActive(): boolean {
    return this.status === ProviderStatus.ACTIVE;
  }

  get isGemini(): boolean {
    return this.type === ProviderType.GEMINI;
  }

  get isOpenAI(): boolean {
    return this.type === ProviderType.OPENAI;
  }

  get hasRateLimit(): boolean {
    return !!this.config.rateLimit;
  }

  get hasPricing(): boolean {
    return !!this.config.pricing;
  }
}
