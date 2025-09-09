import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

// 手动导入所有实体
import { User } from '../users/entities/user.entity';
import { File } from '../files/entities/file.entity';
import { Annotation } from '../annotations/entities/annotation.entity';
import { Quiz } from '../quizzes/entities/quiz.entity';
import { Question } from '../quizzes/entities/question.entity';
import { QuizAttempt } from '../quizzes/entities/quiz-attempt.entity';
import { Plan } from '../plans/entities/plan.entity';
import { UserPlan } from '../plans/entities/user-plan.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ApiCall } from '../providers/entities/api-call.entity';
import { ApiKey } from '../providers/entities/api-key.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 3306),
      username: this.configService.get('DB_USERNAME', 'root'),
      password: this.configService.get('DB_PASSWORD', 'password'),
      database: this.configService.get('DB_DATABASE', 'eap2'),
      entities: [
        User,
        File,
        Annotation,
        Quiz,
        Question,
        QuizAttempt,
        Plan,
        UserPlan,
        Provider,
        ApiCall,
        ApiKey,
      ],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      logging: this.configService.get('NODE_ENV') === 'development',
      timezone: '+08:00',
      charset: 'utf8mb4',
    };
  }
}

// 用于CLI的数据源配置
const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'eap2',
  entities: [
    User,
    File,
    Annotation,
    Quiz,
    Question,
    QuizAttempt,
    Plan,
    UserPlan,
    Provider,
    ApiCall,
    ApiKey,
  ],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  timezone: '+08:00',
  charset: 'utf8mb4',
};

export default new DataSource(dataSourceOptions);
