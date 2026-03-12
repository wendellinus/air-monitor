import { Inject, Injectable, Logger } from '@nestjs/common';

import type { AlertProvider } from '../../infra/qweather/qweather.providers';
import { QWEATHER_ALERT_PROVIDER } from '../../infra/qweather/qweather.tokens';
import type { QweatherWeatherAlert } from '../../infra/qweather/qweather.types';
import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';

import type { AdminCreateNoticeDto } from './dto/admin-create-notice.dto';
import type { AdminUpdateNoticeDto } from './dto/admin-update-notice.dto';
import { NoticeLevel, NoticeSource, NoticeStatus } from './notice.constants';
import { NoticeRepository, type NoticeEntity } from './notice.repository';

function parseIsoOrNow(s: string | undefined): Date {
  if (!s) return new Date();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

type AdminNoticeListFilters = {
  status?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
};

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);

  constructor(
    private readonly repo: NoticeRepository,
    @Inject(QWEATHER_ALERT_PROVIDER) private readonly alerts: AlertProvider,
  ) {}

  async getActiveNotices(): Promise<NoticeEntity[]> {
    return this.repo.getActiveNotices(new Date());
  }

  async syncWeatherAlerts(lat: string, lon: string): Promise<number> {
    let data: QweatherWeatherAlert;
    try {
      data = await this.alerts.fetchWeatherAlert(lat, lon);
    } catch (e) {
      this.logger.warn('sync weather alerts failed', e as Error);
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }

    if (data.zeroResult || data.alerts.length === 0) return 0;

    let created = 0;
    for (const a of data.alerts) {
      if (!a.id) continue;
      const exists = await this.repo.existsByAlertId(a.id);
      if (exists) continue;

      const startTime = parseIsoOrNow(a.effectiveTime);
      const endTime = a.expireTime ? parseIsoOrNow(a.expireTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const content = a.instruction ? `${a.description}\n\n[Instruction]\n${a.instruction}` : a.description;
      const level = a.severity === 'severe' || a.severity === 'extreme' ? NoticeLevel.Urgent : NoticeLevel.Info;

      const notice: Omit<NoticeEntity, 'id'> = {
        title: a.headline,
        content,
        createdByName: '系统同步',
        startTime,
        endTime,
        status: NoticeStatus.Published,
        level,
        alertId: a.id,
        eventType: a.eventType?.name,
        severity: a.severity,
        colorCode: a.color?.code,
        source: NoticeSource.Qweather,
      };

      await this.repo.create(notice);
      created++;
    }

    return created;
  }

  async listAdmin(
    page: number,
    pageSize: number,
    filters: AdminNoticeListFilters = {},
  ): Promise<{ list: NoticeEntity[]; total: number; page: number; pageSize: number }> {
    const { list, total } = await this.repo.listAdmin(page, pageSize, filters);
    return { list, total, page, pageSize };
  }

  async createManualNotice(dto: AdminCreateNoticeDto, actorName: string): Promise<{ id: number }> {
    if (dto.startTime.getTime() >= dto.endTime.getTime()) {
      throw new AppError(ErrorCodes.ParamError, '\u5f00\u59cb\u65f6\u95f4\u5fc5\u987b\u65e9\u4e8e\u7ed3\u675f\u65f6\u95f4');
    }

    const entity: Omit<NoticeEntity, 'id'> = {
      title: dto.title,
      content: dto.content,
      createdByName: actorName,
      startTime: dto.startTime,
      endTime: dto.endTime,
      // Manual notices are time-driven: pending/active/expired is derived from start/end time.
      status: NoticeStatus.Published,
      level: dto.level,
      source: NoticeSource.Manual,
    };

    const id = await this.repo.createAndReturnId(entity);
    return { id };
  }

  async updateManualNotice(id: number, dto: AdminUpdateNoticeDto): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError(ErrorCodes.ParamError, '\u516c\u544a\u4e0d\u5b58\u5728');
    if (existing.source !== NoticeSource.Manual) {
      throw new AppError(ErrorCodes.ParamError, '\u53ea\u5141\u8bb8\u66f4\u65b0\u624b\u52a8\u516c\u544a');
    }

    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    if (startTime.getTime() >= endTime.getTime()) {
      throw new AppError(ErrorCodes.ParamError, '\u5f00\u59cb\u65f6\u95f4\u5fc5\u987b\u65e9\u4e8e\u7ed3\u675f\u65f6\u95f4');
    }

    await this.repo.updateById(id, {
      title: dto.title ?? existing.title,
      content: dto.content ?? existing.content,
      startTime,
      endTime,
      level: dto.level ?? existing.level,
    });
  }

  async publishManualNotice(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError(ErrorCodes.ParamError, '\u516c\u544a\u4e0d\u5b58\u5728');
    if (existing.source !== NoticeSource.Manual) {
      throw new AppError(ErrorCodes.ParamError, '\u53ea\u5141\u8bb8\u53d1\u5e03\u624b\u52a8\u516c\u544a');
    }
    await this.repo.setStatus(id, NoticeStatus.Published);
  }

  async unpublishManualNotice(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError(ErrorCodes.ParamError, '\u516c\u544a\u4e0d\u5b58\u5728');
    if (existing.source !== NoticeSource.Manual) {
      throw new AppError(ErrorCodes.ParamError, '\u53ea\u5141\u8bb8\u4e0b\u7ebf\u624b\u52a8\u516c\u544a');
    }
    await this.repo.setStatus(id, NoticeStatus.Revoked);
  }

  async revokeManualNotice(id: number): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError(ErrorCodes.ParamError, '\u516c\u544a\u4e0d\u5b58\u5728');
    if (existing.source !== NoticeSource.Manual) {
      throw new AppError(ErrorCodes.ParamError, '\u53ea\u5141\u8bb8\u4f5c\u5e9f\u624b\u52a8\u516c\u544a');
    }
    await this.repo.setStatus(id, NoticeStatus.Revoked);
  }
}
