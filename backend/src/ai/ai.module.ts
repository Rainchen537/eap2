import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { File } from '../files/entities/file.entity';
import { Annotation } from '../annotations/entities/annotation.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
// import { Question } from '../quizzes/entities/question.entity';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, Annotation, Quiz]),
    ProvidersModule,
  ],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
