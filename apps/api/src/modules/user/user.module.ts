import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CityModule } from '../city/city.module';
import { PermissionModule } from '../permission/permission.module';

import { AdminUserController } from './admin-user.controller';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule, CityModule, PermissionModule],
  controllers: [UserController, AdminUserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository],
})
export class UserModule {}
