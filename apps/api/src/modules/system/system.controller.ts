import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// 简单存放在内存的系统配置（重启失效，适合简单场景）
let pollingInterval = 60000; // 默认 60 秒

@ApiTags('admin-system')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/system')
export class SystemController {
  @Roles('admin', 'operator', 'user')
  @ApiOperation({ summary: '获取系统公共配置' })
  @Get('config')
  getConfig() {
    return {
      pollingInterval,
    };
  }

  @Roles('admin')
  @ApiOperation({ summary: '修改系统运维配置' })
  @Post('config')
  setConfig(@Body() dto: { pollingInterval: number }) {
    if (typeof dto.pollingInterval === 'number' && dto.pollingInterval >= 5000) {
      pollingInterval = dto.pollingInterval;
    }
    return { ok: true, pollingInterval };
  }
}
