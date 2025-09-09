import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { QuizAttemptsService } from './quiz-attempts.service';
import { QuizAttemptsController } from './quiz-attempts.controller';
import { Quiz } from './entities/quiz.entity';
import { Question } from './entities/question.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { FilesModule } from '../files/files.module';
import { AnnotationsModule } from '../annotations/annotations.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Question, QuizAttempt]),
    FilesModule,
    AnnotationsModule,
    ProvidersModule,
  ],
  controllers: [QuizzesController, QuizAttemptsController],
  providers: [QuizzesService, QuizAttemptsService],
  exports: [QuizzesService, QuizAttemptsService],
})
export class QuizzesModule {}
