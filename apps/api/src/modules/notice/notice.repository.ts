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

@Injectable()
export class NoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    const rows = await this.prisma.notice.findMany({
      where: {
        status: NoticeStatus.Published,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      select: {
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
      },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content ?? undefined,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      level: r.level,
      alertId: r.alertId ?? undefined,
      eventType: r.eventType ?? undefined,
      severity: r.severity ?? undefined,
      colorCode: r.colorCode ?? undefined,
      source: r.source,
    }));
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
        select: {
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
        },
      }),
    ]);

    return {
      total,
      list: rows.map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content ?? undefined,
        startTime: r.startTime,
        endTime: r.endTime,
        status: r.status,
        level: r.level,
        alertId: r.alertId ?? undefined,
        eventType: r.eventType ?? undefined,
        severity: r.severity ?? undefined,
        colorCode: r.colorCode ?? undefined,
        source: r.source,
      })),
    };
  }

  async findById(id: number): Promise<NoticeEntity | null> {
    const r = await this.prisma.notice.findUnique({
      where: { id },
      select: {
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
      },
    });
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      content: r.content ?? undefined,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      level: r.level,
      alertId: r.alertId ?? undefined,
      eventType: r.eventType ?? undefined,
      severity: r.severity ?? undefined,
      colorCode: r.colorCode ?? undefined,
      source: r.source,
    };
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
