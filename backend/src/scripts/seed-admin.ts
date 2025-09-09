import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ProvidersService } from '../providers/providers.service';
import { UserRole } from '../users/entities/user.entity';
import { ProviderType, ProviderStatus } from '../providers/entities/provider.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function seedAdmin() {
  console.log('🌱 开始创建管理员用户和默认AI配置...');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const usersService = app.get(UsersService);
    const providersService = app.get(ProvidersService);
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    // 检查管理员用户是否已存在
    const existingAdmin = await usersService.findByEmail('admin@eap2.com');

    if (!existingAdmin) {
      // 直接使用repository创建管理员用户
      console.log('👤 创建管理员用户...');

      const adminUser = userRepository.create({
        email: 'admin@eap2.com',
        password: '$2b$12$ozBHMx8MRIr4Apl0Nw2.yu/85baIkBPclWF9pNzaLRucchHtFhuQK', // admin123
        firstName: '系统',
        lastName: '管理员',
        role: UserRole.ADMIN,
        status: 'active',
        emailVerifiedAt: new Date(),
      });

      await userRepository.save(adminUser);
      console.log('✅ 管理员用户创建成功:', adminUser.email);
    } else {
      // 更新现有用户为管理员
      console.log('👤 更新现有用户为管理员...');
      await usersService.updateUserRole(existingAdmin.id, UserRole.ADMIN);
      console.log('✅ 用户角色更新成功:', existingAdmin.email);
    }

    // 检查是否已有默认Provider
    const providers = await providersService.findAll(1, 1);
    
    if (providers.total === 0) {
      // 创建默认AI配置
      console.log('🤖 创建默认AI配置...');
      
      const defaultProvider = await providersService.create({
        name: '默认Gemini配置',
        description: '系统默认的Gemini AI配置，使用第三方中转服务',
        type: ProviderType.GEMINI,
        config: {
          apiKey: 'sk-quizonly',
          baseUrl: 'https://nnhentyqsfgw.ap-northeast-1.clawcloudrun.com',
          model: 'gemini-pro',
          maxTokens: 2048,
          temperature: 0.7,
          timeout: 30000,
        },
        priority: 10,
        isDefault: true,
        metadata: {
          source: 'system-seed',
          description: '系统初始化时创建的默认配置',
        },
      });
      
      console.log('✅ 默认AI配置创建成功:', defaultProvider.name);
      
      // 创建OpenAI示例配置（非默认）
      const openaiProvider = await providersService.create({
        name: 'OpenAI示例配置',
        description: 'OpenAI API配置示例，需要配置有效的API密钥',
        type: ProviderType.OPENAI,
        config: {
          apiKey: 'your-openai-api-key-here',
          baseUrl: 'https://api.openai.com',
          model: 'gpt-4',
          maxTokens: 2048,
          temperature: 0.7,
          timeout: 30000,
        },
        priority: 5,
        isDefault: false,
        metadata: {
          source: 'system-seed',
          description: '系统提供的OpenAI配置模板',
          status: 'template',
        },
      });
      
      console.log('✅ OpenAI示例配置创建成功:', openaiProvider.name);
    } else {
      console.log('ℹ️  AI配置已存在，跳过创建');
    }

    console.log('🎉 种子数据创建完成！');
    console.log('');
    console.log('📋 创建的账户信息：');
    console.log('   邮箱: admin@eap2.com');
    console.log('   密码: admin123');
    console.log('   角色: 管理员');
    console.log('');
    console.log('🔗 访问地址：');
    console.log('   前端: http://localhost:5173');
    console.log('   后端API: http://localhost:3000/api');
    console.log('   管理员后台: http://localhost:5173/admin');
    console.log('   AI配置管理: http://localhost:5173/admin/ai-config');

  } catch (error) {
    console.error('❌ 种子数据创建失败:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// 运行种子脚本
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { seedAdmin };
