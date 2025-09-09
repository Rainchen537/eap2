import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Annotation, AnnotationSource } from './entities/annotation.entity';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { UpdateAnnotationDto } from './dto/update-annotation.dto';

@Injectable()
export class AnnotationsService {
  constructor(
    @InjectRepository(Annotation)
    private annotationRepository: Repository<Annotation>,
  ) {}

  async create(createAnnotationDto: CreateAnnotationDto, userId: string): Promise<Annotation> {
    // 检查是否有重叠的标注
    const overlappingAnnotations = await this.findOverlappingAnnotations(
      createAnnotationDto.fileId,
      createAnnotationDto.startOffset,
      createAnnotationDto.endOffset,
      userId
    );

    // 删除重叠的标注（覆盖模式）
    if (overlappingAnnotations.length > 0) {
      await this.annotationRepository.remove(overlappingAnnotations);
    }

    const annotation = this.annotationRepository.create({
      ...createAnnotationDto,
      userId,
      source: createAnnotationDto.source === 'ai_suggested' ? AnnotationSource.AI_SUGGESTED : AnnotationSource.MANUAL,
    });
    return await this.annotationRepository.save(annotation);
  }

  async createBatch(annotations: CreateAnnotationDto[], userId: string): Promise<Annotation[]> {
    const annotationEntities = annotations.map(dto =>
      this.annotationRepository.create({
        ...dto,
        userId,
        source: dto.source === 'ai_suggested' ? AnnotationSource.AI_SUGGESTED : AnnotationSource.MANUAL,
      })
    );
    return await this.annotationRepository.save(annotationEntities);
  }

  async findAll(userId: string): Promise<Annotation[]> {
    return await this.annotationRepository.find({
      where: { userId },
      relations: ['file'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByFile(fileId: string, userId: string): Promise<Annotation[]> {
    return await this.annotationRepository.find({
      where: { fileId, userId },
      order: { startOffset: 'ASC' },
    });
  }

  // 查找重叠的标注
  async findOverlappingAnnotations(
    fileId: string,
    startOffset: number,
    endOffset: number,
    userId: string
  ): Promise<Annotation[]> {
    return await this.annotationRepository
      .createQueryBuilder('annotation')
      .where('annotation.fileId = :fileId', { fileId })
      .andWhere('annotation.userId = :userId', { userId })
      .andWhere(
        '(annotation.startOffset < :endOffset AND annotation.endOffset > :startOffset)',
        { startOffset, endOffset }
      )
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Annotation> {
    const annotation = await this.annotationRepository.findOne({
      where: { id, userId },
      relations: ['file'],
    });

    if (!annotation) {
      throw new NotFoundException('标注不存在');
    }

    return annotation;
  }

  async update(id: string, updateAnnotationDto: UpdateAnnotationDto, userId: string): Promise<Annotation> {
    const annotation = await this.findOne(id, userId);

    Object.assign(annotation, updateAnnotationDto);
    return await this.annotationRepository.save(annotation);
  }

  async remove(id: string, userId: string): Promise<void> {
    const annotation = await this.findOne(id, userId);
    await this.annotationRepository.remove(annotation);
  }

  async removeByFile(fileId: string, userId: string): Promise<void> {
    await this.annotationRepository.delete({ fileId, userId });
  }
}
