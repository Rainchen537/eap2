import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  @ApiResponse({ status: 200, description: '服务健康状态' })
  async getHealth() {
    return await this.healthService.getHealthStatus();
  }

  @Get('ai')
  @ApiOperation({ summary: 'AI服务健康检查' })
  @ApiResponse({ status: 200, description: 'AI服务状态' })
  async getAIHealth() {
    return await this.healthService.getAIHealthStatus();
  }
}
