import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider, ProviderStatus, ProviderType } from '../entities/provider.entity';
import { LLMProvider } from '../interfaces/llm-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { MockProvider } from './mock.provider';

@Injectable()
export class ProviderFactory {
  private readonly logger = new Logger(ProviderFactory.name);
  private readonly providers = new Map<string, LLMProvider>();

  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    private configService: ConfigService,
  ) {}

  async getProvider(providerId?: string): Promise<LLMProvider> {
    // 在开发环境或没有配置API密钥时使用Mock Provider
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    const hasApiKey = this.configService.get('GEMINI_API_KEY') &&
                     this.configService.get('GEMINI_API_KEY') !== 'your-gemini-api-key-here';

    if (isDevelopment && !hasApiKey) {
      this.logger.warn('Using Mock Provider for development');
      return new MockProvider();
    }

    let provider: Provider;

    if (providerId) {
      provider = await this.providerRepository.findOne({
        where: { id: providerId, status: ProviderStatus.ACTIVE },
      });
    } else {
      // 获取默认Provider
      provider = await this.providerRepository.findOne({
        where: { isDefault: true, status: ProviderStatus.ACTIVE },
      });
    }

    if (!provider) {
      this.logger.warn('No active provider found in database, using Mock Provider');
      return new MockProvider();
    }

    // 检查缓存
    const cacheKey = provider.id;
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey);
    }

    // 创建新的Provider实例
    try {
      const llmProvider = this.createProvider(provider);
      this.providers.set(cacheKey, llmProvider);
      return llmProvider;
    } catch (error) {
      this.logger.error(`Failed to create provider ${provider.type}: ${error.message}`);
      this.logger.warn('Falling back to Mock Provider');
      return new MockProvider();
    }
  }

  private createProvider(provider: Provider): LLMProvider {
    switch (provider.type) {
      case ProviderType.GEMINI:
        return new GeminiProvider(this.configService);

      case ProviderType.MOCK:
        return new MockProvider();

      // 可以在这里添加其他Provider类型
      // case 'openai':
      //   return new OpenAIProvider(this.configService);

      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }

  async refreshProvider(providerId: string): Promise<void> {
    this.providers.delete(providerId);
    this.logger.log(`Provider ${providerId} cache cleared`);
  }

  async refreshAllProviders(): Promise<void> {
    this.providers.clear();
    this.logger.log('All provider caches cleared');
  }
}
