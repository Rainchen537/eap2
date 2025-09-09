import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { Provider } from './entities/provider.entity';
import { ApiKey } from './entities/api-key.entity';
import { ApiCall } from './entities/api-call.entity';
import { ProviderFactory } from './services/provider.factory';
import { GeminiProvider } from './services/gemini.provider';
import { MockProvider } from './services/mock.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, ApiKey, ApiCall])],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProviderFactory, GeminiProvider, MockProvider],
  exports: [ProvidersService, ProviderFactory],
})
export class ProvidersModule {}
