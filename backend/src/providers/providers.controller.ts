import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';

@ApiTags('LLM Provider管理')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // TODO: 实现LLM Provider相关API
}
