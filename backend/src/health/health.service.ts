import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderFactory } from '../providers/services/provider.factory';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private configService: ConfigService,
    private providerFactory: ProviderFactory,
  ) {}

  async getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('NODE_ENV'),
      version: '1.0.0',
    };
  }

  async getAIHealthStatus() {
    try {
      const provider = await this.providerFactory.getProvider();
      
      // 测试AI服务连接
      const testResponse = await provider.generateCompletion([
        { role: 'user', content: '测试连接，请回复"连接成功"' }
      ]);

      return {
        status: 'ok',
        provider: 'available',
        response: testResponse.content,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('AI health check failed', error);
      
      return {
        status: 'degraded',
        provider: 'unavailable',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
