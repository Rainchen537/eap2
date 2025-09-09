import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('套餐管理')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // TODO: 实现套餐相关API
}
