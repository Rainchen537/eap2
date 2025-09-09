import { IsString, IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiProperty({ description: '文件ID' })
  @IsString()
  fileId: string;

  @ApiProperty({ description: '题目数量', minimum: 1, maximum: 20, default: 5 })
  @IsNumber()
  @Min(1)
  @Max(20)
  questionCount: number;

  @ApiProperty({ 
    description: '题目类型', 
    enum: ['mcq', 'fill_blank', 'short_answer'],
    default: 'mcq'
  })
  @IsEnum(['mcq', 'fill_blank', 'short_answer'])
  questionType: 'mcq' | 'fill_blank' | 'short_answer';

  @ApiProperty({ 
    description: '题目难度', 
    enum: ['easy', 'medium', 'hard'],
    required: false,
    default: 'medium'
  })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}
