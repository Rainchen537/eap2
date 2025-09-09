import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileParserService } from './services/file-parser.service';
import { File } from './entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = configService.get('UPLOAD_PATH', './uploads');
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
            const ext = extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
          },
        }),
        limits: {
          fileSize: configService.get('MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
        },
        fileFilter: (req, file, cb) => {
          // 修复中文文件名编码问题
          try {
            let decodedName = file.originalname;
            console.log('原始文件名:', file.originalname);
            console.log('原始文件名字节:', Buffer.from(file.originalname, 'utf8'));

            // 检测是否为UTF-8编码的中文
            const isValidUTF8 = (str: string) => {
              try {
                return Buffer.from(str, 'utf8').toString('utf8') === str;
              } catch {
                return false;
              }
            };

            // 如果不是有效的UTF-8，尝试多种解码方式
            if (!isValidUTF8(decodedName) || decodedName.includes('�')) {
              console.log('检测到编码问题，尝试修复...');

              // 方法1: 从latin1转utf8
              try {
                const latin1ToUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
                if (isValidUTF8(latin1ToUtf8) && !latin1ToUtf8.includes('�')) {
                  decodedName = latin1ToUtf8;
                  console.log('latin1->utf8 成功:', decodedName);
                }
              } catch (e) {
                console.log('latin1->utf8 失败');
              }

              // 方法2: URL解码
              if (decodedName.includes('�') || decodedName === file.originalname) {
                try {
                  const urlDecoded = decodeURIComponent(escape(file.originalname));
                  if (isValidUTF8(urlDecoded) && !urlDecoded.includes('�')) {
                    decodedName = urlDecoded;
                    console.log('URL解码成功:', decodedName);
                  }
                } catch (e) {
                  console.log('URL解码失败');
                }
              }

              // 方法3: 尝试从Buffer重新解码
              if (decodedName.includes('�') || decodedName === file.originalname) {
                try {
                  const buffer = Buffer.from(file.originalname, 'binary');
                  const binaryToUtf8 = buffer.toString('utf8');
                  if (isValidUTF8(binaryToUtf8) && !binaryToUtf8.includes('�')) {
                    decodedName = binaryToUtf8;
                    console.log('binary->utf8 成功:', decodedName);
                  }
                } catch (e) {
                  console.log('binary->utf8 失败');
                }
              }
            }

            file.originalname = decodedName;
            console.log('最终处理的文件名:', file.originalname);

            const allowedTypes = configService
              .get('ALLOWED_FILE_TYPES', '.docx,.txt,.md')
              .split(',');
            const ext = extname(file.originalname).toLowerCase();

            if (allowedTypes.includes(ext)) {
              cb(null, true);
            } else {
              cb(new Error(`不支持的文件类型: ${ext}`), false);
            }
          } catch (error) {
            console.error('文件名处理错误:', error);
            cb(error, false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, FileParserService],
  exports: [FilesService, TypeOrmModule],
})
export class FilesModule {}
