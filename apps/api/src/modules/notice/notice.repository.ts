import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { NoticeStatus } from './notice.constants';

export type NoticeEntity = {
  id: number;
  title: string;
  content?: string;
  createdByName?: string;
  startTime: Date;
  endTime: Date;
  status: string;
  level: string;
  alertId?: string;
  eventType?: string;
  severity?: string;
  colorCode?: string;
  source: string;
};

const noticeSelect = {
  id: true,
  title: true,
  content: true,
  createdByName: true,
  startTime: true,
  endTime: true,
  status: true,
  level: true,
  alertId: true,
  eventType: true,
  severity: true,
  colorCode: true,
  source: true,
} as const;

type NoticeRow = {
  id: number;
  title: string;
  content: string | null;
  createdByName: string | null;
  startTime: Date;
  endTime: Date;
  status: string;
  level: string;
  alertId: string | null;
  eventType: string | null;
  severity: string | null;
  colorCode: string | null;
  source: string;
};

type AdminNoticeListFilters = {
  status?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
};

@Injectable()
export class NoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: NoticeRow): NoticeEntity {
    return {
      id: row.id,
      title: row.title,
      content: row.content ?? undefined,
      createdByName: row.createdByName ?? undefined,
      startTime: row.startTime,
      endTime: row.endTime,
      status: row.status,
      level: row.level,
      alertId: row.alertId ?? undefined,
      eventType: row.eventType ?? undefined,
      severity: row.severity ?? undefined,
      colorCode: row.colorCode ?? undefined,
      source: row.source,
    };
  }

  async create(n: Omit<NoticeEntity, 'id'>): Promise<void> {
    await this.prisma.notice.create({
      data: {
        title: n.title,
        content: n.content ?? null,
        createdByName: n.createdByName ?? null,
        startTime: n.startTime,
        endTime: n.endTime,
        status: n.status,
        level: n.level,
        alertId: n.alertId ?? null,
        eventType: n.eventType ?? null,
        severity: n.severity ?? null,
        colorCode: n.colorCode ?? null,
        source: n.source,
      },
    });
  }

  async createAndReturnId(n: Omit<NoticeEntity, 'id'>): Promise<number> {
    const row = await this.prisma.notice.create({
      data: {
        title: n.title,
        content: n.content ?? null,
        createdByName: n.createdByName ?? null,
        startTime: n.startTime,
        endTime: n.endTime,
        status: n.status,
        level: n.level,
        alertId: n.alertId ?? null,
        eventType: n.eventType ?? null,
        severity: n.severity ?? null,
        colorCode: n.colorCode ?? null,
        source: n.source,
      },
      select: { id: true },
    });
    return row.id;
  }

  async existsByAlertId(alertId: string): Promise<boolean> {
    const found = await this.prisma.notice.findFirst({ where: { alertId }, select: { id: true } });
    return Boolean(found);
  }

  async getActiveNotices(now: Date): Promise<NoticeEntity[]> {
    const rows: NoticeRow[] = await this.prisma.notice.findMany({
      where: {
        status: NoticeStatus.Published,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      select: noticeSelect,
    });
    return rows.map((row) => this.toEntity(row));
  }

  async listAdmin(
    page: number,
    pageSize: number,
    filters: AdminNoticeListFilters = {},
  ): Promise<{ list: NoticeEntity[]; total: number }> {
    const conditions: Prisma.NoticeWhereInput[] = [];
    if (filters.status) {
      const now = new Date();
      if (filters.status === 'revoked') {
        conditions.push({ status: NoticeStatus.Revoked });
      } else if (filters.status === 'expired') {
        conditions.push({ status: { not: NoticeStatus.Revoked } });
        conditions.push({ endTime: { lt: now } });
      } else if (filters.status === 'pending') {
        conditions.push({ status: { not: NoticeStatus.Revoked } });
        conditions.push({ startTime: { gt: now } });
        conditions.push({ endTime: { gte: now } });
      } else if (filters.status === 'active') {
        conditions.push({ status: { not: NoticeStatus.Revoked } });
        conditions.push({ startTime: { lte: now } });
        conditions.push({ endTime: { gte: now } });
      }
    }
    // Overlap between notice interval [startTime, endTime] and filter interval [effectiveFrom, effectiveTo].
    if (filters.effectiveFrom) {
      conditions.push({ endTime: { gte: filters.effectiveFrom } });
    }
    if (filters.effectiveTo) {
      conditions.push({ startTime: { lte: filters.effectiveTo } });
    }
    const where: Prisma.NoticeWhereInput = conditions.length > 0 ? { AND: conditions } : {};
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: noticeSelect,
      }),
    ]);
    const typedRows = rows as NoticeRow[];

    return {
      total: total as number,
      list: typedRows.map((row) => this.toEntity(row)),
    };
  }

  async findById(id: number): Promise<NoticeEntity | null> {
    const r = (await this.prisma.notice.findUnique({
      where: { id },
      select: noticeSelect,
    })) as NoticeRow | null;
    if (!r) return null;
    return this.toEntity(r);
  }

  async updateById(id: number, patch: Partial<Omit<NoticeEntity, 'id'>>): Promise<void> {
    await this.prisma.notice.update({
      where: { id },
      data: {
        title: patch.title,
        content: patch.content ?? undefined,
        createdByName: patch.createdByName,
        startTime: patch.startTime,
        endTime: patch.endTime,
        status: patch.status,
        level: patch.level,
        source: patch.source,
      },
    });
  }

  async setStatus(id: number, status: string): Promise<void> {
    await this.prisma.notice.update({
      where: { id },
      data: { status },
    });
  }
}
