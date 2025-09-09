import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty({ description: '文件描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '文件元数据', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
