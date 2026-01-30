import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../shared/authz/roles.decorator';
import { RolesGuard } from '../../shared/authz/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { AdminCreateNoticeDto } from './dto/admin-create-notice.dto';
import { AdminNoticeListQueryDto } from './dto/admin-notice-list-query.dto';
import { AdminUpdateNoticeDto } from './dto/admin-update-notice.dto';
import { NoticeService } from './notice.service';

@ApiTags('admin-notice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('admin/notices')
export class AdminNoticeController {
  constructor(private readonly notices: NoticeService) {}

  @Get()
  async list(@Query() q: AdminNoticeListQueryDto): Promise<unknown> {
    return this.notices.listAdmin(q.page, q.pageSize, q.status);
  }

  @Post()
  async create(@Body() dto: AdminCreateNoticeDto): Promise<unknown> {
    return this.notices.createManualNotice(dto);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUpdateNoticeDto): Promise<unknown> {
    await this.notices.updateManualNotice(id, dto);
    return { ok: true };
  }

  @Post(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    await this.notices.publishManualNotice(id);
    return { ok: true };
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    await this.notices.unpublishManualNotice(id);
    return { ok: true };
  }
}

