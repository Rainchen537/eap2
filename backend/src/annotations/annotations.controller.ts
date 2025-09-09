import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnnotationsService } from './annotations.service';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';

@ApiTags('标注管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('annotations')
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  @Post()
  @ApiOperation({ summary: '创建标注' })
  @ApiResponse({ status: 201, description: '标注创建成功' })
  create(@Body() createAnnotationDto: CreateAnnotationDto, @Request() req) {
    return this.annotationsService.create(createAnnotationDto, req.user.id);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量创建标注' })
  @ApiResponse({ status: 201, description: '批量标注创建成功' })
  createBatch(@Body() data: { annotations: CreateAnnotationDto[] }, @Request() req) {
    return this.annotationsService.createBatch(data.annotations, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取标注列表' })
  @ApiResponse({ status: 200, description: '获取标注列表成功' })
  findAll(@Request() req) {
    return this.annotationsService.findAll(req.user.id);
  }

  @Get('file/:fileId')
  @ApiOperation({ summary: '获取文件的所有标注' })
  @ApiResponse({ status: 200, description: '获取文件标注成功' })
  findByFile(@Param('fileId') fileId: string, @Request() req) {
    return this.annotationsService.findByFile(fileId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取标注详情' })
  @ApiResponse({ status: 200, description: '获取标注详情成功' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.annotationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新标注' })
  @ApiResponse({ status: 200, description: '标注更新成功' })
  update(@Param('id') id: string, @Body() updateAnnotationDto: UpdateAnnotationDto, @Request() req) {
    return this.annotationsService.update(id, updateAnnotationDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标注' })
  @ApiResponse({ status: 200, description: '标注删除成功' })
  remove(@Param('id') id: string, @Request() req) {
    return this.annotationsService.remove(id, req.user.id);
  }
}
