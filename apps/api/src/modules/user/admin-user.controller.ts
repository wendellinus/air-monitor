import { Body, Controller, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { UserService } from './user.service';

@ApiTags('admin-user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly users: UserService) {}

  @Roles('admin', 'operator')
  @Patch(':id/status')
  async setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: SetUserStatusDto): Promise<unknown> {
    await this.users.setUserActive(id, dto.isActive);
    return { ok: true };
  }

  @Roles('admin', 'operator')
  @Post(':id/reset-password')
  async resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetPasswordDto): Promise<unknown> {
    await this.users.resetPassword(id, dto.newPassword);
    return { ok: true };
  }

  @Roles('admin')
  @Patch(':id/role')
  async setRole(@Param('id', ParseIntPipe) id: number, @Body() dto: SetUserRoleDto): Promise<unknown> {
    await this.users.setUserRole(id, dto.role);
    return { ok: true };
  }
}

