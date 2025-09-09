import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIService } from './ai.service';
import { SuggestAnnotationsDto, GenerateQuizDto, EvaluateAnswerDto } from './dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('suggest-annotations')
  @ApiOperation({ summary: 'AI自动标注建议' })
  @ApiResponse({ status: 200, description: '返回标注建议' })
  async suggestAnnotations(
    @Body() suggestAnnotationsDto: SuggestAnnotationsDto,
    @Request() req,
  ) {
    try {
      const suggestions = await this.aiService.suggestAnnotations(
        suggestAnnotationsDto.fileId,
        req.user.id,
      );
      
      return {
        success: true,
        data: suggestions,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-quiz')
  @ApiOperation({ summary: 'AI生成题目' })
  @ApiResponse({ status: 200, description: '返回生成的题目' })
  async generateQuiz(
    @Body() generateQuizDto: GenerateQuizDto,
    @Request() req,
  ) {
    try {
      const quiz = await this.aiService.generateQuiz(
        generateQuizDto,
        req.user.id,
      );
      
      return {
        success: true,
        data: quiz,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('evaluate-answer')
  @ApiOperation({ summary: 'AI评估答案' })
  @ApiResponse({ status: 200, description: '返回评估结果' })
  async evaluateAnswer(
    @Body() evaluateAnswerDto: EvaluateAnswerDto,
    @Request() req,
  ) {
    try {
      const evaluation = await this.aiService.evaluateAnswer(
        evaluateAnswerDto,
        req.user.id,
      );
      
      return {
        success: true,
        data: evaluation,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
