import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { NoticeItem } from '@air-monitor/shared';

import { NoticeService } from './notice.service';
import type { NoticeEntity } from './notice.repository';

@ApiTags('notice')
@Controller('notice')
export class NoticeController {
  constructor(private readonly notice: NoticeService) {}

  private toItem(n: NoticeEntity): NoticeItem {
    return {
      id: n.id,
      title: n.title,
      content: n.content,
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

  // GET /api/v1/notice/active
  @Get('active')
  async active(): Promise<NoticeItem[]> {
    const list = await this.notice.getActiveNotices();
    return list.map((n) => this.toItem(n));
  }
}
