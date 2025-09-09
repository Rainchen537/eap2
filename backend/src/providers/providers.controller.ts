import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { TestProviderDto, GetModelsDto } from './dto/test-provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('LLM Provider管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @ApiOperation({ summary: '创建AI Provider配置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createProviderDto: CreateProviderDto) {
    const provider = await this.providersService.create(createProviderDto);
    return {
      message: '创建AI Provider配置成功',
      data: { provider },
    };
  }

  @Get()
  @ApiOperation({ summary: '获取AI Provider列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const result = await this.providersService.findAll(+page, +limit);
    return {
      message: '获取AI Provider列表成功',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取AI Provider详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findOne(@Param('id') id: string) {
    const provider = await this.providersService.findOne(id);
    return {
      message: '获取AI Provider详情成功',
      data: { provider },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新AI Provider配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ) {
    const provider = await this.providersService.update(id, updateProviderDto);
    return {
      message: '更新AI Provider配置成功',
      data: { provider },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除AI Provider配置' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.providersService.remove(id);
    return {
      message: '删除AI Provider配置成功',
    };
  }

  @Post('test')
  @ApiOperation({ summary: '测试AI Provider连接' })
  @ApiResponse({ status: 200, description: '测试成功' })
  async testConnection(@Body() testProviderDto: TestProviderDto) {
    const result = await this.providersService.testConnection(testProviderDto);
    return {
      message: 'AI Provider连接测试完成',
      data: result,
    };
  }

  @Post('models')
  @ApiOperation({ summary: '获取可用模型列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getModels(@Body() getModelsDto: GetModelsDto) {
    const models = await this.providersService.getAvailableModels(getModelsDto);
    return {
      message: '获取可用模型列表成功',
      data: { models },
    };
  }

  @Patch(':id/default')
  @ApiOperation({ summary: '设置默认AI Provider' })
  @ApiResponse({ status: 200, description: '设置成功' })
  async setDefault(@Param('id') id: string) {
    const provider = await this.providersService.setDefault(id);
    return {
      message: '设置默认AI Provider成功',
      data: { provider },
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '切换AI Provider状态' })
  @ApiResponse({ status: 200, description: '切换成功' })
  async toggleStatus(@Param('id') id: string) {
    const provider = await this.providersService.toggleStatus(id);
    return {
      message: 'AI Provider状态切换成功',
      data: { provider },
    };
  }
}
