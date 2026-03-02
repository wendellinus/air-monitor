import { Module } from '@nestjs/common';
import { CityModule } from '../city/city.module';

import { AdminUserController } from './admin-user.controller';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [CityModule],
  controllers: [UserController, AdminUserController],
  providers: [UserRepository, UserService],
  exports: [UserRepository],
})
export class UserModule {}
