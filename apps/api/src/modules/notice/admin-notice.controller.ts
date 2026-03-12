import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { NoticeAdminListData, NoticeItem, OkResponseData } from '@air-monitor/shared';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types';

import { AdminCreateNoticeDto } from './dto/admin-create-notice.dto';
import { AdminNoticeListQueryDto } from './dto/admin-notice-list-query.dto';
import { AdminUpdateNoticeDto } from './dto/admin-update-notice.dto';
import { NoticeService } from './notice.service';
import type { NoticeEntity } from './notice.repository';

@ApiTags('admin-notice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'operator')
@Controller('admin/notices')
export class AdminNoticeController {
  constructor(private readonly notices: NoticeService) {}

  private toItem(n: NoticeEntity): NoticeItem {
    return {
      id: n.id,
      title: n.title,
      content: n.content,
      createdByName: n.createdByName,
      startTime: n.startTime.toISOString(),
      endTime: n.endTime.toISOString(),
      status: n.status,
      level: n.level,
      alertId: n.alertId,
      eventType: n.eventType,
      severity: n.severity,
      colorCode: n.colorCode,
      source: n.source,
    };
  }

  @Permissions('notices.view')
  @Get()
  async list(@Query() q: AdminNoticeListQueryDto): Promise<NoticeAdminListData> {
    const { list, total, page, pageSize } = await this.notices.listAdmin(q.page, q.pageSize, {
      status: q.status,
      effectiveFrom: q.effectiveFrom,
      effectiveTo: q.effectiveTo,
    });
    return { list: list.map((n) => this.toItem(n)), total, page, pageSize };
  }

  @Permissions('notices.create')
  @Post()
  async create(@Body() dto: AdminCreateNoticeDto, @CurrentUser() user: JwtUser): Promise<{ id: number }> {
    return this.notices.createManualNotice(dto, user.username);
  }

  @Permissions('notices.create')
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateNoticeDto): Promise<OkResponseData> {
    await this.notices.updateManualNotice(id, dto);
    return { ok: true };
  }

  @Permissions('notices.publish')
  @Post(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number): Promise<OkResponseData> {
    await this.notices.publishManualNotice(id);
    return { ok: true };
  }

  @Permissions('notices.publish')
  @Post(':id/unpublish')
  async unpublish(@Param('id', ParseIntPipe) id: number): Promise<OkResponseData> {
    await this.notices.unpublishManualNotice(id);
    return { ok: true };
  }

  @Permissions('notices.publish')
  @Post(':id/revoke')
  async revoke(@Param('id', ParseIntPipe) id: number): Promise<OkResponseData> {
    await this.notices.revokeManualNotice(id);
    return { ok: true };
  }
}
