import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileStatus } from './entities/file.entity';
import { FileParserService } from './services/file-parser.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private fileParserService: FileParserService,
  ) {}

  async create(createFileDto: CreateFileDto, uploadedFile: Express.Multer.File, userId: string): Promise<File> {
    try {
      // 修复中文文件名编码问题
      let originalFilename = uploadedFile.originalname;

      // 如果包含乱码字符，尝试重新解码
      if (originalFilename.includes('�') || /[\x00-\x1f\x7f-\x9f]/.test(originalFilename)) {
        try {
          // 尝试从latin1转utf8
          originalFilename = Buffer.from(uploadedFile.originalname, 'latin1').toString('utf8');

          // 如果还是有问题，尝试URL解码
          if (originalFilename.includes('�')) {
            originalFilename = decodeURIComponent(escape(uploadedFile.originalname));
          }
        } catch (e) {
          console.warn('文件名解码失败，使用原始名称:', uploadedFile.originalname);
          originalFilename = uploadedFile.originalname;
        }
      }

      console.log('最终处理的文件名:', originalFilename);

      // 创建文件记录
      const file = this.fileRepository.create({
        ...createFileDto,
        originalFilename: originalFilename,
        filename: uploadedFile.filename,
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
        path: uploadedFile.path,
        userId,
        status: FileStatus.PROCESSING,
      });

      const savedFile = await this.fileRepository.save(file);
      
      // 异步处理文件解析
      this.processFileAsync(savedFile.id, uploadedFile.path, uploadedFile.mimetype);
      
      return savedFile;
    } catch (error) {
      this.logger.error(`文件创建失败: ${error.message}`, error.stack);
      throw new BadRequestException('文件创建失败');
    }
  }

  async findAll(userId: string, page = 1, limit = 10): Promise<{ files: File[]; total: number }> {
    const [files, total] = await this.fileRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { files, total };
  }

  async findOne(id: string, userId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id, userId },
      relations: ['annotations', 'quizzes'],
    });

    if (!file) {
      throw new NotFoundException('文件不存在');
    }

    return file;
  }

  async update(id: string, updateFileDto: UpdateFileDto, userId: string): Promise<File> {
    const file = await this.findOne(id, userId);
    
    Object.assign(file, updateFileDto);
    return await this.fileRepository.save(file);
  }

  async remove(id: string, userId: string): Promise<void> {
    const file = await this.findOne(id, userId);
    await this.fileRepository.remove(file);
  }

  async getFileContent(id: string, userId: string): Promise<{ canonicalText: string; blocks: any[] }> {
    const file = await this.findOne(id, userId);
    
    if (!file.isProcessed) {
      throw new BadRequestException('文件尚未处理完成');
    }

    return {
      canonicalText: file.canonicalText,
      blocks: file.blocks,
    };
  }

  private async processFileAsync(fileId: string, filePath: string, mimeType: string): Promise<void> {
    try {
      this.logger.log(`开始处理文件: ${fileId}`);
      
      // 解析文件
      const parseResult = await this.fileParserService.parseFile(filePath, mimeType);
      
      // 更新文件记录
      await this.fileRepository.update(fileId, {
        canonicalText: parseResult.canonicalText,
        blocks: parseResult.blocks,
        metadata: parseResult.metadata,
        status: FileStatus.COMPLETED,
      });
      
      this.logger.log(`文件处理完成: ${fileId}`);
    } catch (error) {
      this.logger.error(`文件处理失败: ${fileId}`, error.stack);
      
      // 更新错误状态
      await this.fileRepository.update(fileId, {
        status: FileStatus.FAILED,
        processingError: error.message,
      });
    }
  }

  async getProcessingStatus(id: string, userId: string): Promise<{ status: FileStatus; error?: string }> {
    const file = await this.findOne(id, userId);
    
    return {
      status: file.status,
      error: file.processingError,
    };
  }

  async searchFiles(userId: string, query: string, page = 1, limit = 10): Promise<{ files: File[]; total: number }> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.userId = :userId', { userId })
      .andWhere(
        '(file.originalFilename LIKE :query OR file.canonicalText LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('file.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [files, total] = await queryBuilder.getManyAndCount();
    
    return { files, total };
  }

  async getFileStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    processingFiles: number;
    completedFiles: number;
    failedFiles: number;
  }> {
    const stats = await this.fileRepository
      .createQueryBuilder('file')
      .select([
        'COUNT(*) as totalFiles',
        'SUM(file.size) as totalSize',
        'SUM(CASE WHEN file.status = :processing THEN 1 ELSE 0 END) as processingFiles',
        'SUM(CASE WHEN file.status = :completed THEN 1 ELSE 0 END) as completedFiles',
        'SUM(CASE WHEN file.status = :failed THEN 1 ELSE 0 END) as failedFiles',
      ])
      .where('file.userId = :userId', { userId })
      .setParameters({
        processing: FileStatus.PROCESSING,
        completed: FileStatus.COMPLETED,
        failed: FileStatus.FAILED,
      })
      .getRawOne();

    return {
      totalFiles: parseInt(stats.totalFiles) || 0,
      totalSize: parseInt(stats.totalSize) || 0,
      processingFiles: parseInt(stats.processingFiles) || 0,
      completedFiles: parseInt(stats.completedFiles) || 0,
      failedFiles: parseInt(stats.failedFiles) || 0,
    };
  }
}
