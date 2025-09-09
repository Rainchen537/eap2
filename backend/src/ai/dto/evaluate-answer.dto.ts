import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EvaluateAnswerDto {
  @ApiProperty({
    description: '题目ID',
    example: 'uuid-string',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  questionId?: string;

  @ApiProperty({
    description: '题目内容',
    example: '什么是人工智能？',
    required: false,
  })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({
    description: '正确答案',
    example: '人工智能是...',
    required: false,
  })
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @ApiProperty({
    description: '用户答案',
    example: 'A',
  })
  @IsString()
  userAnswer: string;
}
