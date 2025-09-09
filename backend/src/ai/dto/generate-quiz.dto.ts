import { IsString, IsUUID, IsArray, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiProperty({
    description: '文件ID',
    example: 'uuid-string',
  })
  @IsUUID()
  fileId: string;

  @ApiProperty({
    description: '题目标题',
    example: '第一章测试题',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '题目描述',
    example: '基于文档内容生成的测试题',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '题目类型',
    example: ['mcq', 'fill', 'short'],
    enum: ['mcq', 'fill', 'short'],
    isArray: true,
  })
  @IsArray()
  @IsEnum(['mcq', 'fill', 'short'], { each: true })
  questionTypes: Array<'mcq' | 'fill' | 'short'>;

  @ApiProperty({
    description: '题目数量',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsInt()
  @Min(1)
  @Max(50)
  count: number;

  @ApiProperty({
    description: '难度等级',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}
