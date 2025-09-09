import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderType } from '../entities/provider.entity';

export class ProviderConfigDto {
  @ApiProperty({ description: 'API密钥' })
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'API基础URL', required: false })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({ description: '模型名称' })
  @IsString()
  model: string;

  @ApiProperty({ description: '最大token数', required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ description: '温度参数', required: false })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiProperty({ description: '超时时间（毫秒）', required: false })
  @IsOptional()
  @IsNumber()
  timeout?: number;
}

export class CreateProviderDto {
  @ApiProperty({ description: 'Provider名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Provider描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Provider类型', enum: ProviderType })
  @IsEnum(ProviderType)
  type: ProviderType;

  @ApiProperty({ description: 'Provider配置', type: ProviderConfigDto })
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config: ProviderConfigDto;

  @ApiProperty({ description: '优先级', required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: '是否为默认Provider', required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ description: '元数据', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
