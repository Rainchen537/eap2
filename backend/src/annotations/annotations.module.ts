import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnotationsService } from './annotations.service';
import { AnnotationsController } from './annotations.controller';
import { Annotation } from './entities/annotation.entity';
import { File } from '../files/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Annotation, File])],
  controllers: [AnnotationsController],
  providers: [AnnotationsService],
  exports: [AnnotationsService, TypeOrmModule],
})
export class AnnotationsModule {}
