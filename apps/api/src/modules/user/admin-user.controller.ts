import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AdminFavoriteCityListData, AdminUserDetailData } from '@air-monitor/shared';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { AuthPasswordCryptoService } from '../auth/auth-password-crypto.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types';

import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminFavoriteQueryDto } from './dto/admin-favorite-query.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetUserRoleDto } from './dto/set-user-role.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { UpdateAdminUserDetailDto } from './dto/update-admin-user-detail.dto';
import { UserService } from './user.service';

@ApiTags('admin-user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(
    private readonly users: UserService,
    private readonly passwordCrypto: AuthPasswordCryptoService,
  ) {}

  @Roles('admin', 'operator')
  @Permissions('favorites.view')
  @Get('favorites/cities')
  async listFavorites(@Query() query: AdminFavoriteQueryDto): Promise<AdminFavoriteCityListData> {
    return this.users.getAdminFavoriteCities(query.page, query.pageSize, query.keyword);
  }

  @Roles('admin', 'operator')
  @Permissions('favorites.delete')
  @Delete('favorites/cities/:userId/:cityId')
  async removeFavorite(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('cityId') cityId: string,
  ): Promise<unknown> {
    await this.users.removeFavoriteCityAsAdmin(userId, cityId);
    return { ok: true };
  }

  @Roles('admin', 'operator')
  @Permissions('users.create')
  @Post()
  async create(
    @CurrentUser() user: JwtUser,
    @Body() dto: AdminCreateUserDto,
  ): Promise<AdminUserDetailData> {
    const password = this.passwordCrypto.resolvePassword(
      dto.password,
      dto.encryptedPassword,
      dto.passwordKeyId,
      6,
    );
    return this.users.createAdminUser(user.userId, user.role, {
      username: dto.username,
      password,
      email: dto.email,
      role: dto.role,
      isActive: dto.isActive,
    });
  }

  @Roles('admin', 'operator')
  @Permissions('users.view')
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number): Promise<AdminUserDetailData> {
    return this.users.getAdminUserDetail(id);
  }

  @Roles('admin', 'operator')
  @Permissions('users.view')
  @Patch(':id')
  async updateDetail(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDetailDto,
  ): Promise<AdminUserDetailData> {
    return this.users.updateAdminUserDetail(user.userId, user.role, id, dto);
  }

  @Roles('admin', 'operator')
  @Permissions('users.status.update')
  @Patch(':id/status')
  async setStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: SetUserStatusDto): Promise<unknown> {
    await this.users.setUserActive(id, dto.isActive);
    return { ok: true };
  }

  @Roles('admin', 'operator')
  @Permissions('users.password.reset')
  @Post(':id/reset-password')
  async resetPassword(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetPasswordDto): Promise<unknown> {
    const newPassword = this.passwordCrypto.resolveNewPassword(
      dto.newPassword,
      dto.encryptedNewPassword,
      dto.passwordKeyId,
    );
    await this.users.resetPassword(id, newPassword);
    return { ok: true };
  }

  @Roles('admin')
  @Permissions('users.role.update')
  @Patch(':id/role')
  async setRole(@Param('id', ParseIntPipe) id: number, @Body() dto: SetUserRoleDto): Promise<unknown> {
    await this.users.setUserRole(id, dto.role);
    return { ok: true };
  }

  @Roles('admin')
  @Permissions('users.delete')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    await this.users.softDeleteUser(id);
    return { ok: true };
  }
}
