import type {
  ProviderOverviewData,
  ProviderRefreshData,
  ProviderTrendData,
} from '@air-monitor/shared';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { ManualRefreshDto } from './dto/manual-refresh.dto';
import { ProviderAccountQueryDto } from './dto/provider-account-query.dto';
import { ProviderAccountService } from './provider-account.service';

@ApiTags('provider-account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/provider-accounts')
export class ProviderAccountController {
  constructor(private readonly account: ProviderAccountService) {}

  @Permissions('apiQuota.view')
  @Get('overview')
  async overview(): Promise<ProviderOverviewData> {
    return this.account.getOverview();
  }

  @Permissions('apiQuota.view')
  @Get('trends')
  async trends(@Query() query: ProviderAccountQueryDto): Promise<ProviderTrendData> {
    return this.account.getTrends(query);
  }

  @Roles('admin')
  @Permissions('apiQuota.refresh')
  @Post('refresh')
  async refresh(@Body() body: ManualRefreshDto): Promise<ProviderRefreshData> {
    return this.account.refresh(body.providers);
  }
}
