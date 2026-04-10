import type { MePermissionsData, RolePermissionTreeData } from '@air-monitor/shared';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types';

import { RoleParamDto } from './dto/role-param.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { PermissionService } from './permission.service';

@ApiTags('permission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class PermissionController {
  constructor(private readonly permissions: PermissionService) {}

  @Get('user/me/permissions')
  async myPermissions(@CurrentUser() user: JwtUser): Promise<MePermissionsData> {
    const list = await this.permissions.getMyPermissionKeys(user.userId, user.role);
    return {
      role: user.role,
      permissions: list,
    };
  }

  @Permissions('permissions.view')
  @Get('admin/permissions/roles/:role')
  async roleTree(@Param() dto: RoleParamDto): Promise<RolePermissionTreeData> {
    return this.permissions.getRolePermissionTree(dto.role);
  }

  @Roles('admin')
  @Permissions('permissions.update')
  @Put('admin/permissions/roles/:role')
  async updateRoleTree(
    @Param() dto: RoleParamDto,
    @Body() body: UpdateRolePermissionsDto,
  ): Promise<RolePermissionTreeData> {
    return this.permissions.updateRolePermissions(dto.role, body.permissionKeys);
  }
}
