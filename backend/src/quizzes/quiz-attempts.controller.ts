import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards, 
  Request,
  Query 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizAttemptsService } from './quiz-attempts.service';
import { StartQuizAttemptDto } from './dto/start-quiz-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FinishQuizAttemptDto } from './dto/finish-quiz-attempt.dto';

@ApiTags('答题记录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quiz-attempts')
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  @Post('start')
  @ApiOperation({ summary: '开始答题' })
  @ApiResponse({ status: 201, description: '开始答题成功' })
  startQuizAttempt(@Body() startQuizAttemptDto: StartQuizAttemptDto, @Request() req) {
    return this.quizAttemptsService.startQuizAttempt(startQuizAttemptDto.quizId, req.user.id);
  }

  @Post(':id/answer')
  @ApiOperation({ summary: '提交单题答案' })
  @ApiResponse({ status: 200, description: '答案提交成功' })
  submitAnswer(
    @Param('id') attemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Request() req
  ) {
    return this.quizAttemptsService.submitAnswer(attemptId, submitAnswerDto, req.user.id);
  }

  @Post(':id/finish')
  @ApiOperation({ summary: '完成答题' })
  @ApiResponse({ status: 200, description: '答题完成' })
  finishQuizAttempt(
    @Param('id') attemptId: string,
    @Body() finishQuizAttemptDto: FinishQuizAttemptDto,
    @Request() req
  ) {
    return this.quizAttemptsService.finishQuizAttempt(attemptId, finishQuizAttemptDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取答题记录列表' })
  @ApiResponse({ status: 200, description: '获取答题记录列表成功' })
  findAll(@Request() req, @Query('quizId') quizId?: string) {
    return this.quizAttemptsService.findAll(req.user.id, quizId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取答题记录详情' })
  @ApiResponse({ status: 200, description: '获取答题记录详情成功' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.quizAttemptsService.findOne(id, req.user.id);
  }
}
