import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS配置
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      configService.get('CORS_ORIGIN', 'http://localhost:5173')
    ],
    credentials: true,
  });

  // API前缀
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('EAP2 API')
    .setDescription('文档精炼与出题平台 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  console.log(`🚀 应用启动成功！`);
  console.log(`📖 API文档: http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`🌐 服务地址: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
