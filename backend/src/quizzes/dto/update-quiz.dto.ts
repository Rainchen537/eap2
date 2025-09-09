import { PartialType } from '@nestjs/swagger';
import { GenerateQuizDto } from './generate-quiz.dto';

export class UpdateQuizDto extends PartialType(GenerateQuizDto) {}
