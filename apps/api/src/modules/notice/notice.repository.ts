import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { NoticeStatus } from './notice.constants';

export type NoticeEntity = {
  id: number;
  title: string;
  content?: string;
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

@Injectable()
export class NoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: NoticeRow): NoticeEntity {
    return {
      id: row.id,
      title: row.title,
      content: row.content ?? undefined,
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

  async listAdmin(page: number, pageSize: number, status?: string): Promise<{ list: NoticeEntity[]; total: number }> {
    const where = status ? { status } : {};
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
