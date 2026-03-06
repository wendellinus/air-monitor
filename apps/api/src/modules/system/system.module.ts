import { Module } from '@nestjs/common';
import { PermissionModule } from '../permission/permission.module';
import { SystemController, SystemPublicController } from './system.controller';
import { SystemRuntimeService } from './system-runtime.service';

@Module({
  imports: [PermissionModule],
  controllers: [SystemController, SystemPublicController],
  providers: [SystemRuntimeService],
})
export class SystemModule {}
