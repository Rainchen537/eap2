import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class StartQuizAttemptDto {
  @ApiProperty({ description: '题目ID' })
  @IsString()
  @IsNotEmpty()
  quizId: string;
}
