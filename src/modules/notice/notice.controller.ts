import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NoticeService } from './notice.service';

@ApiTags('notice')
@Controller('notice')
export class NoticeController {
  constructor(private readonly notice: NoticeService) {}

  // GET /api/v1/notice/active
  @Get('active')
  async active(): Promise<unknown> {
    return this.notice.getActiveNotices();
  }
}

