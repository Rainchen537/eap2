import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: '用户答案' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: '答题用时（秒）', required: false })
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}
