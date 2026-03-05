import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type {
  ProviderMetricKey,
  ProviderRequestCountMeta,
  ProviderTrendBucket,
  ProviderType,
} from '@air-monitor/shared';

import { PrismaService } from '../../infra/prisma/prisma.service';

type SnapshotInsert = {
  provider: ProviderType;
  source: 'live' | 'mock';
  snapshotAt: Date;
  balance: number | null;
  requestCount: number | null;
  quotaLimit: number | null;
  quotaUsed: number | null;
  usageRate: number | null;
  raw: Record<string, unknown>;
};

type MetricPointInsert = {
  provider: ProviderType;
  metricKey: ProviderMetricKey;
  bucket: ProviderTrendBucket;
  time: Date;
  value: number;
};

export type ProviderSnapshotEntity = {
  provider: ProviderType;
  source: 'live' | 'mock';
  snapshotAt: Date;
  balance: number | null;
  requestCount: number | null;
  quotaLimit: number | null;
  quotaUsed: number | null;
  usageRate: number | null;
  requestCountMeta: ProviderRequestCountMeta | null;
};

export type ProviderMetricPointEntity = {
  provider: ProviderType;
  metricKey: ProviderMetricKey;
  bucket: ProviderTrendBucket;
  time: Date;
  value: number;
};

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(String(value));
  return Number.isFinite(n) ? n : null;
}

function toRequestCountMeta(value: unknown): ProviderRequestCountMeta | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const scope = record.scope;
  const source = record.source;
  const snapshotAt = record.snapshotAt;
  if (
    typeof scope !== 'string' ||
    typeof source !== 'string' ||
    typeof snapshotAt !== 'string' ||
    !scope
  ) {
    return null;
  }
  const note = typeof record.note === 'string' && record.note.trim() ? record.note : undefined;
  if (scope !== 'today' && scope !== 'month' && scope !== 'rolling' && scope !== 'unknown') {
    return null;
  }
  const normalizedScope = scope as ProviderRequestCountMeta['scope'];
  return {
    scope: normalizedScope,
    source,
    snapshotAt,
    note,
  };
}

@Injectable()
export class ProviderAccountRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async insertSnapshot(input: SnapshotInsert): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "ProviderAccountSnapshot"
        ("provider", "source", "snapshotAt", "balance", "requestCount", "quotaLimit", "quotaUsed", "usageRate", "raw", "createdAt")
      VALUES
        (
          ${input.provider},
          ${input.source},
          ${input.snapshotAt},
          ${input.balance},
          ${input.requestCount},
          ${input.quotaLimit},
          ${input.quotaUsed},
          ${input.usageRate},
          ${JSON.stringify(input.raw)}::jsonb,
          NOW()
        )
    `;
  }

  async upsertMetricPoints(points: MetricPointInsert[]): Promise<void> {
    if (points.length === 0) return;
    await this.prisma.$transaction(async (tx) => {
      for (const point of points) {
        await tx.$executeRaw`
          INSERT INTO "ProviderAccountMetricPoint"
            ("provider", "metricKey", "bucket", "time", "value", "createdAt", "updatedAt")
          VALUES
            (${point.provider}, ${point.metricKey}, ${point.bucket}, ${point.time}, ${point.value}, NOW(), NOW())
          ON CONFLICT ("provider", "metricKey", "bucket", "time")
          DO UPDATE SET
            "value" = EXCLUDED."value",
            "updatedAt" = NOW()
        `;
      }
    });
  }

  async listLatestSnapshots(providers: ProviderType[]): Promise<ProviderSnapshotEntity[]> {
    if (providers.length === 0) return [];
    const rows = await this.prisma.$queryRaw<
      Array<{
        provider: ProviderType;
        source: 'live' | 'mock';
        snapshotAt: Date;
        balance: unknown;
        requestCount: number | null;
        quotaLimit: number | null;
        quotaUsed: number | null;
        usageRate: unknown;
        raw: unknown;
      }>
    >(Prisma.sql`
      SELECT DISTINCT ON ("provider")
        "provider",
        "source",
        "snapshotAt",
        "balance",
        "requestCount",
        "quotaLimit",
        "quotaUsed",
        "usageRate",
        "raw"
      FROM "ProviderAccountSnapshot"
      WHERE "provider" IN (${Prisma.join(providers)})
      ORDER BY
        "provider" ASC,
        "snapshotAt" DESC,
        "id" DESC
    `);

    return rows.map((row) => ({
      provider: row.provider,
      source: row.source,
      snapshotAt: row.snapshotAt,
      balance: asNumber(row.balance),
      requestCount: row.requestCount,
      quotaLimit: row.quotaLimit,
      quotaUsed: row.quotaUsed,
      usageRate: asNumber(row.usageRate),
      requestCountMeta: toRequestCountMeta(
        row.raw && typeof row.raw === 'object'
          ? (row.raw as Record<string, unknown>)['requestCountMeta']
          : null,
      ),
    }));
  }

  async listTrendPoints(params: {
    providers: ProviderType[];
    metricKey: ProviderMetricKey;
    bucket: ProviderTrendBucket;
    from: Date;
    to: Date;
  }): Promise<ProviderMetricPointEntity[]> {
    if (params.providers.length === 0) return [];
    const rows = await this.prisma.$queryRaw<
      Array<{
        provider: ProviderType;
        metricKey: ProviderMetricKey;
        bucket: ProviderTrendBucket;
        time: Date;
        value: unknown;
      }>
    >(Prisma.sql`
      SELECT
        "provider",
        "metricKey",
        "bucket",
        "time",
        "value"
      FROM "ProviderAccountMetricPoint"
      WHERE "provider" IN (${Prisma.join(params.providers)})
        AND "metricKey" = ${params.metricKey}
        AND "bucket" = ${params.bucket}
        AND "time" >= ${params.from}
        AND "time" <= ${params.to}
      ORDER BY "provider" ASC, "time" ASC
    `);

    return rows
      .map((row) => {
        const value = asNumber(row.value);
        if (value === null) return null;
        return {
          provider: row.provider,
          metricKey: row.metricKey,
          bucket: row.bucket,
          time: row.time,
          value,
        } satisfies ProviderMetricPointEntity;
      })
      .filter((item): item is ProviderMetricPointEntity => item !== null);
  }
}
