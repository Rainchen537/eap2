import { Injectable, HttpException, HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Provider, ProviderStatus, ProviderType } from './entities/provider.entity';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { TestProviderDto, GetModelsDto } from './dto/test-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    private configService: ConfigService,
  ) {}

  async generateContent(prompt: string): Promise<string> {
    console.log('开始调用AI生成题目...');
    console.log('AI生成题目请求:', prompt);

    try {
      // 获取默认的活跃Provider
      const provider = await this.providerRepository.findOne({
        where: { isDefault: true, status: ProviderStatus.ACTIVE },
      });

      if (!provider) {
        // 如果没有配置的Provider，回退到环境变量
        console.warn('没有找到默认Provider，使用环境变量配置');
        return await this.generateContentFromEnv(prompt);
      }

      console.log('使用Provider:', {
        name: provider.name,
        type: provider.type,
        model: provider.config.model
      });

      return await this.callProviderAPI(provider, prompt);

    } catch (error) {
      console.error('AI调用失败:', error.message);
      throw new HttpException(`AI调用失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 环境变量回退方法（保持向后兼容）
  private async generateContentFromEnv(prompt: string): Promise<string> {
    const apiKey = this.configService.get('GEMINI_API_KEY');
    const baseUrl = this.configService.get('GEMINI_API_BASE_URL');
    const model = this.configService.get('GEMINI_MODEL', 'gemini-pro');

    console.log('API配置:', {
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined',
      baseUrl,
      model
    });

    if (!apiKey) {
      throw new HttpException('GEMINI_API_KEY not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!baseUrl) {
      throw new HttpException('GEMINI_API_BASE_URL not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 构建完整的API URL，确保没有双斜杠
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const apiUrl = `${cleanBaseUrl}/v1/chat/completions`;
    console.log('调用API URL:', apiUrl);

    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000
      }
    );

    console.log('AI API响应状态:', response.status);
    console.log('AI API响应数据:', JSON.stringify(response.data, null, 2));

    if (response.data?.choices?.[0]?.message?.content) {
      const aiResponse = response.data.choices[0].message.content;
      console.log('AI生成的内容:', aiResponse);
      return aiResponse;
    } else {
      console.error('AI响应格式错误:', response.data);
      throw new HttpException('AI响应格式错误', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // CRUD操作
  async create(createProviderDto: CreateProviderDto): Promise<Provider> {
    // 检查名称是否已存在
    const existingProvider = await this.providerRepository.findOne({
      where: { name: createProviderDto.name },
    });

    if (existingProvider) {
      throw new ConflictException('Provider名称已存在');
    }

    // 如果设置为默认，先取消其他默认Provider
    if (createProviderDto.isDefault) {
      await this.providerRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }

    const provider = this.providerRepository.create(createProviderDto);
    return await this.providerRepository.save(provider);
  }

  async findAll(page = 1, limit = 10): Promise<{ providers: Provider[]; total: number }> {
    const [providers, total] = await this.providerRepository.findAndCount({
      order: { priority: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { providers, total };
  }

  async findOne(id: string): Promise<Provider> {
    const provider = await this.providerRepository.findOne({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('Provider不存在');
    }

    return provider;
  }

  async update(id: string, updateProviderDto: UpdateProviderDto): Promise<Provider> {
    const provider = await this.findOne(id);

    // 如果设置为默认，先取消其他默认Provider
    if (updateProviderDto.isDefault) {
      await this.providerRepository.update(
        { isDefault: true, id: { $ne: id } as any },
        { isDefault: false }
      );
    }

    Object.assign(provider, updateProviderDto);
    return await this.providerRepository.save(provider);
  }

  async remove(id: string): Promise<void> {
    const provider = await this.findOne(id);

    // 不允许删除默认Provider
    if (provider.isDefault) {
      throw new ConflictException('不能删除默认Provider');
    }

    await this.providerRepository.remove(provider);
  }

  async setDefault(id: string): Promise<Provider> {
    const provider = await this.findOne(id);

    // 先取消其他默认Provider
    await this.providerRepository.update(
      { isDefault: true },
      { isDefault: false }
    );

    // 设置当前Provider为默认
    provider.isDefault = true;
    provider.status = ProviderStatus.ACTIVE;

    return await this.providerRepository.save(provider);
  }

  async toggleStatus(id: string): Promise<Provider> {
    const provider = await this.findOne(id);

    // 切换状态
    provider.status = provider.status === ProviderStatus.ACTIVE
      ? ProviderStatus.INACTIVE
      : ProviderStatus.ACTIVE;

    return await this.providerRepository.save(provider);
  }

  // 测试连接
  async testConnection(testProviderDto: TestProviderDto): Promise<{
    success: boolean;
    message: string;
    response?: string;
    error?: string;
  }> {
    try {
      let provider: Provider;

      if (testProviderDto.providerId) {
        provider = await this.findOne(testProviderDto.providerId);
      } else {
        // 使用默认Provider
        provider = await this.providerRepository.findOne({
          where: { isDefault: true, status: ProviderStatus.ACTIVE },
        });

        if (!provider) {
          throw new NotFoundException('没有找到默认的活跃Provider');
        }
      }

      const testMessage = testProviderDto.testMessage || '测试连接，请回复"连接成功"';
      const response = await this.callProviderAPI(provider, testMessage);

      return {
        success: true,
        message: 'Provider连接测试成功',
        response: response,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Provider连接测试失败',
        error: error.message,
      };
    }
  }

  // 获取可用模型
  async getAvailableModels(getModelsDto: GetModelsDto): Promise<string[]> {
    try {
      let provider: Provider;

      if (getModelsDto.providerId) {
        provider = await this.findOne(getModelsDto.providerId);
      } else {
        // 使用默认Provider
        provider = await this.providerRepository.findOne({
          where: { isDefault: true, status: ProviderStatus.ACTIVE },
        });

        if (!provider) {
          throw new NotFoundException('没有找到默认的活跃Provider');
        }
      }

      return await this.fetchModelsFromProvider(provider);
    } catch (error) {
      throw new HttpException(`获取模型列表失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 调用Provider API的通用方法
  private async callProviderAPI(provider: Provider, prompt: string): Promise<string> {
    const { apiKey, baseUrl, model, temperature = 0.7, maxTokens = 2048, timeout = 30000 } = provider.config;

    if (!apiKey) {
      throw new HttpException('API密钥未配置', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!baseUrl) {
      throw new HttpException('API基础URL未配置', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 构建API URL
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const apiUrl = `${cleanBaseUrl}/v1/chat/completions`;

    const response = await axios.post(
      apiUrl,
      {
        model: model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    } else {
      throw new HttpException('AI响应格式错误', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 从Provider获取模型列表
  private async fetchModelsFromProvider(provider: Provider): Promise<string[]> {
    const { apiKey, baseUrl, timeout = 30000 } = provider.config;

    if (!apiKey || !baseUrl) {
      throw new HttpException('Provider配置不完整', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const apiUrl = `${cleanBaseUrl}/v1/models`;

      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout
      });

      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map((model: any) => model.id || model.name).filter(Boolean);
      } else {
        // 如果API不支持模型列表，返回常见模型
        return this.getDefaultModels(provider.type);
      }
    } catch (error) {
      // 如果获取失败，返回默认模型列表
      console.warn(`获取模型列表失败，使用默认列表: ${error.message}`);
      return this.getDefaultModels(provider.type);
    }
  }

  // 获取默认模型列表
  private getDefaultModels(providerType: ProviderType): string[] {
    switch (providerType) {
      case ProviderType.GEMINI:
        return ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'];
      case ProviderType.OPENAI:
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o', 'gpt-4o-mini'];
      case ProviderType.CLAUDE:
        return ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
      default:
        return ['default-model'];
    }
  }

  private extractQuestionCount(prompt: string): number {
    const match = prompt.match(/(\d+)道/);
    return match ? parseInt(match[1]) : 2;
  }
}
