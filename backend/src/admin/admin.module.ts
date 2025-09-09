import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { PlansModule } from '../plans/plans.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [UsersModule, PlansModule, ProvidersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
