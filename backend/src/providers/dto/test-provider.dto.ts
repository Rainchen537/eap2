import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestProviderDto {
  @ApiProperty({ description: 'Provider ID', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ description: '测试消息', required: false, default: '测试连接，请回复"连接成功"' })
  @IsOptional()
  @IsString()
  testMessage?: string;
}

export class GetModelsDto {
  @ApiProperty({ description: 'Provider ID', required: false })
  @IsOptional()
  @IsString()
  providerId?: string;
}
