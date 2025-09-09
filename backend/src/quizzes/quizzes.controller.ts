import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@ApiTags('题目管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate')
  @ApiOperation({ summary: '生成题目' })
  @ApiResponse({ status: 201, description: '题目生成成功' })
  generateQuiz(@Body() generateQuizDto: GenerateQuizDto, @Request() req) {
    return this.quizzesService.generateQuiz(generateQuizDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取题目列表' })
  @ApiResponse({ status: 200, description: '获取题目列表成功' })
  findAll(@Request() req, @Query('fileId') fileId?: string) {
    return this.quizzesService.findAll(req.user.id, fileId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取题目详情' })
  @ApiResponse({ status: 200, description: '获取题目详情成功' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.quizzesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新题目' })
  @ApiResponse({ status: 200, description: '题目更新成功' })
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto, @Request() req) {
    return this.quizzesService.update(id, updateQuizDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除题目' })
  @ApiResponse({ status: 200, description: '题目删除成功' })
  remove(@Param('id') id: string, @Request() req) {
    return this.quizzesService.remove(id, req.user.id);
  }
}
