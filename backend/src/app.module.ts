import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { AnnotationsModule } from './annotations/annotations.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { PlansModule } from './plans/plans.module';
import { ProvidersModule } from './providers/providers.module';
import { AdminModule } from './admin/admin.module';
import { AIModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 数据库模块
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1分钟
        limit: 100, // 100次请求
      },
    ]),

    // 静态文件服务
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // 业务模块
    AuthModule,
    UsersModule,
    FilesModule,
    AnnotationsModule,
    QuizzesModule,
    PlansModule,
    ProvidersModule,
    AdminModule,
    AIModule,
    HealthModule,
  ],
})
export class AppModule {}
