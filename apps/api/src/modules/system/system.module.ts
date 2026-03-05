import { Module } from '@nestjs/common';
import { PermissionModule } from '../permission/permission.module';
import { SystemController } from './system.controller';

@Module({
  imports: [PermissionModule],
  controllers: [SystemController],
})
export class SystemModule {}
