import { Module } from '@nestjs/common';
import { PermissionModule } from '../permission/permission.module';

import { AdminNoticeController } from './admin-notice.controller';
import { NoticeController } from './notice.controller';
import { NoticeRepository } from './notice.repository';
import { NoticeScheduler } from './notice.scheduler';
import { NoticeService } from './notice.service';

@Module({
  imports: [PermissionModule],
  controllers: [NoticeController, AdminNoticeController],
  providers: [NoticeRepository, NoticeService, NoticeScheduler],
  exports: [NoticeService],
})
export class NoticeModule {}
