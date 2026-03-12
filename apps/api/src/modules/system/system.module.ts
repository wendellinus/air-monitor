import { Module } from '@nestjs/common';

import { PermissionModule } from '../permission/permission.module';

import { SystemController, SystemPublicController } from './system.controller';
import { SystemRepository } from './system.repository';
import { SystemService } from './system.service';

@Module({
  imports: [PermissionModule],
  controllers: [SystemController, SystemPublicController],
  providers: [SystemRepository, SystemService],
})
export class SystemModule {}
