import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { SystemService } from './system.service';

@ApiTags('admin-system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/system')
export class SystemController {
  constructor(private readonly system: SystemService) {}

  @Permissions('system.view')
  @ApiOperation({ summary: 'Get system config (admin)' })
  @Get('config')
  async getConfig(): Promise<{ pollingInterval: number }> {
    return this.system.getConfig();
  }

  @Roles('admin')
  @Permissions('system.update')
  @ApiOperation({ summary: 'Update system runtime config' })
  @Post('config')
  async setConfig(@Body() dto: UpdateSystemConfigDto): Promise<{ ok: true; pollingInterval: number }> {
    const config = await this.system.setPollingInterval(dto.pollingInterval);
    return { ok: true, pollingInterval: config.pollingInterval };
  }
}

@ApiTags('system')
@Controller('system')
export class SystemPublicController {
  constructor(private readonly system: SystemService) {}

  @ApiOperation({ summary: 'Get system runtime config (public)' })
  @Get('config')
  async getPublicConfig(): Promise<{ pollingInterval: number }> {
    return this.system.getConfig();
  }
}
