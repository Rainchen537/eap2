import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('文件管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '文件上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createFileDto: CreateFileDto,
    @Request() req,
  ) {
    return await this.filesService.create(createFileDto, file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取文件列表' })
  @ApiResponse({ status: 200, description: '获取文件列表成功' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return await this.filesService.findAll(req.user.id, +page, +limit);
  }

  @Get('search')
  @ApiOperation({ summary: '搜索文件' })
  @ApiResponse({ status: 200, description: '搜索文件成功' })
  async searchFiles(
    @Query('q') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return await this.filesService.searchFiles(req.user.id, query, +page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取文件统计信息' })
  @ApiResponse({ status: 200, description: '获取统计信息成功' })
  async getStats(@Request() req) {
    return await this.filesService.getFileStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文件详情' })
  @ApiResponse({ status: 200, description: '获取文件详情成功' })
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.filesService.findOne(id, req.user.id);
  }

  @Get(':id/content')
  @ApiOperation({ summary: '获取文件内容' })
  @ApiResponse({ status: 200, description: '获取文件内容成功' })
  async getContent(@Param('id') id: string, @Request() req) {
    return await this.filesService.getFileContent(id, req.user.id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: '获取文件处理状态' })
  @ApiResponse({ status: 200, description: '获取处理状态成功' })
  async getStatus(@Param('id') id: string, @Request() req) {
    return await this.filesService.getProcessingStatus(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新文件信息' })
  @ApiResponse({ status: 200, description: '更新文件成功' })
  async update(
    @Param('id') id: string,
    @Body() updateFileDto: UpdateFileDto,
    @Request() req,
  ) {
    return await this.filesService.update(id, updateFileDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文件' })
  @ApiResponse({ status: 200, description: '删除文件成功' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.filesService.remove(id, req.user.id);
    return { message: '文件删除成功' };
  }
}
