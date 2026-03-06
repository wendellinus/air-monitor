import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { SystemRuntimeService } from './system-runtime.service';

@ApiTags('admin-system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/system')
export class SystemController {
  constructor(private readonly runtime: SystemRuntimeService) {}

  @Roles('admin', 'operator', 'user')
  @Permissions('system.view')
  @ApiOperation({ summary: 'Get system config (admin)' })
  @Get('config')
  getConfig() {
    return {
      pollingInterval: this.runtime.getPollingInterval(),
    };
  }

  @Roles('admin')
  @Permissions('system.update')
  @ApiOperation({ summary: 'Update system runtime config' })
  @Post('config')
  setConfig(@Body() dto: { pollingInterval: number }) {
    if (typeof dto.pollingInterval === 'number' && dto.pollingInterval >= 5000) {
      this.runtime.setPollingInterval(dto.pollingInterval);
    }
    return { ok: true, pollingInterval: this.runtime.getPollingInterval() };
  }
}

@ApiTags('system')
@Controller('system')
export class SystemPublicController {
  constructor(private readonly runtime: SystemRuntimeService) {}

  @ApiOperation({ summary: 'Get system runtime config (public)' })
  @Get('config')
  getPublicConfig() {
    return {
      pollingInterval: this.runtime.getPollingInterval(),
    };
  }
}
