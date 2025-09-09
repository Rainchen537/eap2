import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class FinishQuizAttemptDto {
  @ApiProperty({ description: '总答题用时（秒）', required: false })
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}
