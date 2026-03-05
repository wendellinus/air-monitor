import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// In-memory config for simple scenarios. Reset after process restart.
let pollingInterval = 60000;

@ApiTags('admin-system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/system')
export class SystemController {
  @Roles('admin', 'operator', 'user')
  @Permissions('system.view')
  @ApiOperation({ summary: 'Get public system config' })
  @Get('config')
  getConfig() {
    return {
      pollingInterval,
    };
  }

  @Roles('admin')
  @Permissions('system.update')
  @ApiOperation({ summary: 'Update system runtime config' })
  @Post('config')
  setConfig(@Body() dto: { pollingInterval: number }) {
    if (typeof dto.pollingInterval === 'number' && dto.pollingInterval >= 5000) {
      pollingInterval = dto.pollingInterval;
    }
    return { ok: true, pollingInterval };
  }
}
