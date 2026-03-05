import { Inject, Injectable, Logger } from '@nestjs/common';

import type {
  ProviderMetricKey,
  ProviderOverviewData,
  ProviderOverviewItem,
  ProviderRequestCountMeta,
  ProviderRefreshData,
  ProviderTrendBucket,
  ProviderTrendData,
  ProviderTrendQuery,
  ProviderType,
} from '@air-monitor/shared';

import { AmapAccountProvider } from './providers/amap-account.provider';
import { QweatherAccountProvider } from './providers/qweather-account.provider';
import type { ProviderAccountSource, ProviderSnapshotDraft } from './providers/types';
import {
  ProviderAccountRepository,
  type ProviderMetricPointEntity,
  type ProviderSnapshotEntity,
} from './provider-account.repository';

const PROVIDERS: ProviderType[] = ['qweather', 'amap'];
const METRICS: ProviderMetricKey[] = ['requestCount', 'quotaUsed', 'quotaLimit', 'usageRate', 'balance'];

function truncateToHour(date: Date): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

function truncateToDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function clampRate(rate: number | null): number | null {
  if (rate === null || !Number.isFinite(rate)) return null;
  if (rate < 0) return 0;
  if (rate > 1) return 1;
  return rate;
}

function providerDisplayName(provider: ProviderType): string {
  return provider === 'qweather' ? 'QWeather' : 'AMap';
}

@Injectable()
export class ProviderAccountService {
  private readonly logger = new Logger(ProviderAccountService.name);
  private readonly sourceMap: Map<ProviderType, ProviderAccountSource>;

  constructor(
    @Inject(ProviderAccountRepository) private readonly repo: ProviderAccountRepository,
    @Inject(QweatherAccountProvider) qweather: QweatherAccountProvider,
    @Inject(AmapAccountProvider) amap: AmapAccountProvider,
  ) {
    this.sourceMap = new Map<ProviderType, ProviderAccountSource>([
      [qweather.provider, qweather],
      [amap.provider, amap],
    ]);
  }

  async getOverview(): Promise<ProviderOverviewData> {
    let snapshots = await this.repo.listLatestSnapshots(PROVIDERS);
    const missing = PROVIDERS.filter((provider) => !snapshots.some((item) => item.provider === provider));
    if (missing.length > 0) {
      await this.syncProviders(missing);
      snapshots = await this.repo.listLatestSnapshots(PROVIDERS);
    }

    const overviewItems = PROVIDERS.map((provider) => {
      const snapshot = snapshots.find((item) => item.provider === provider);
      return this.toOverviewItem(provider, snapshot);
    });

    const totalRequestCount = overviewItems.reduce((sum, item) => sum + (item.requestCount ?? 0), 0);
    const totalQuotaUsed = overviewItems.reduce((sum, item) => sum + (item.quotaUsed ?? 0), 0);
    const totalQuotaLimit = overviewItems.reduce((sum, item) => sum + (item.quotaLimit ?? 0), 0);
    const usageRate = totalQuotaLimit > 0 ? totalQuotaUsed / totalQuotaLimit : null;

    return {
      generatedAt: new Date().toISOString(),
      providers: overviewItems,
      totals: {
        requestCount: totalRequestCount,
        quotaUsed: totalQuotaUsed,
        quotaLimit: totalQuotaLimit,
        usageRate: clampRate(usageRate),
      },
    };
  }

  async getTrends(query: ProviderTrendQuery): Promise<ProviderTrendData> {
    const metricKey = query.metricKey ?? 'requestCount';
    const bucket = query.bucket ?? 'day';
    const provider = query.provider ?? 'all';
    const providers = provider === 'all' ? PROVIDERS : [provider];

    const now = new Date();
    const defaultFrom = bucket === 'hour'
      ? new Date(now.getTime() - 48 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : defaultFrom;
    const to = query.to ? new Date(query.to) : now;

    const points = await this.repo.listTrendPoints({
      providers,
      metricKey,
      bucket,
      from,
      to,
    });

    const series = providers.map((currentProvider) => ({
      provider: currentProvider,
      metricKey,
      bucket,
      points: points
        .filter((item) => item.provider === currentProvider)
        .map((item) => ({ time: item.time.toISOString(), value: item.value })),
    }));

    return {
      provider,
      metricKey,
      bucket,
      from: from.toISOString(),
      to: to.toISOString(),
      series,
    };
  }

  async refresh(providers?: ProviderType[]): Promise<ProviderRefreshData> {
    const targetProviders = providers && providers.length > 0 ? providers : PROVIDERS;
    const errors: Array<{ provider: ProviderType; message: string }> = [];

    for (const provider of targetProviders) {
      const source = this.sourceMap.get(provider);
      if (!source) {
        errors.push({ provider, message: `provider source not found: ${provider}` });
        continue;
      }

      try {
        const snapshot = await source.fetchSnapshot();
        await this.persistSnapshot(snapshot);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(`refresh provider account failed: provider=${provider} message=${message}`);
        errors.push({ provider, message });
      }
    }

    const overview = await this.getOverview();
    const refreshedProviders = overview.providers.filter((item) => targetProviders.includes(item.provider));

    return {
      refreshedAt: new Date().toISOString(),
      providers: refreshedProviders,
      errors,
    };
  }

  async syncProviders(providers?: ProviderType[]): Promise<void> {
    await this.refresh(providers);
  }

  private async persistSnapshot(snapshot: ProviderSnapshotDraft): Promise<void> {
    const raw: Record<string, unknown> = {
      ...snapshot.raw,
      requestCountMeta: snapshot.requestCountMeta
        ? {
            ...snapshot.requestCountMeta,
            snapshotAt: snapshot.snapshotAt.toISOString(),
          }
        : null,
    };

    await this.repo.insertSnapshot({
      provider: snapshot.provider,
      source: snapshot.source,
      snapshotAt: snapshot.snapshotAt,
      balance: snapshot.balance,
      requestCount: snapshot.requestCount,
      quotaLimit: snapshot.quotaLimit,
      quotaUsed: snapshot.quotaUsed,
      usageRate: clampRate(snapshot.usageRate),
      raw,
    });

    const points = this.toMetricPoints(snapshot);
    await this.repo.upsertMetricPoints(points);
  }

  private toOverviewItem(provider: ProviderType, snapshot?: ProviderSnapshotEntity): ProviderOverviewItem {
    if (!snapshot) {
      return {
        provider,
        displayName: providerDisplayName(provider),
        balance: null,
        requestCount: null,
        quotaLimit: null,
        quotaUsed: null,
        usageRate: null,
        status: 'degraded',
        source: 'snapshot',
        updatedAt: null,
        requestCountMeta: null,
      };
    }

    return {
      provider,
      displayName: providerDisplayName(provider),
      balance: snapshot.balance,
      requestCount: snapshot.requestCount,
      quotaLimit: snapshot.quotaLimit,
      quotaUsed: snapshot.quotaUsed,
      usageRate: clampRate(snapshot.usageRate),
      status: 'ok',
      source: snapshot.source === 'mock' ? 'mock' : 'snapshot',
      updatedAt: snapshot.snapshotAt.toISOString(),
      requestCountMeta: this.normalizeRequestCountMeta(snapshot.requestCountMeta, snapshot.snapshotAt),
    };
  }

  private normalizeRequestCountMeta(
    meta: ProviderRequestCountMeta | null | undefined,
    snapshotAt: Date,
  ): ProviderRequestCountMeta | null {
    if (!meta) return null;
    return {
      scope: meta.scope,
      source: meta.source,
      note: meta.note,
      snapshotAt: meta.snapshotAt || snapshotAt.toISOString(),
    };
  }

  private toMetricPoints(snapshot: ProviderSnapshotDraft): ProviderMetricPointEntity[] {
    const metricEntries: Array<{ metricKey: ProviderMetricKey; value: number | null }> = METRICS.map((metricKey) => ({
      metricKey,
      value: snapshot[metricKey],
    }));

    const hourTime = truncateToHour(snapshot.snapshotAt);
    const dayTime = truncateToDay(snapshot.snapshotAt);
    const points: ProviderMetricPointEntity[] = [];

    for (const entry of metricEntries) {
      if (entry.value === null || !Number.isFinite(entry.value)) continue;

      points.push({
        provider: snapshot.provider,
        metricKey: entry.metricKey,
        bucket: 'hour',
        time: hourTime,
        value: entry.value,
      });
      points.push({
        provider: snapshot.provider,
        metricKey: entry.metricKey,
        bucket: 'day',
        time: dayTime,
        value: entry.value,
      });
    }

    return points;
  }
}
