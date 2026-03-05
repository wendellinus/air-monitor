import type { ProviderMetricScope, ProviderType } from '@air-monitor/shared';

export type ProviderRequestCountMetaDraft = {
  scope: ProviderMetricScope;
  source: string;
  note?: string;
};

export type ProviderSnapshotDraft = {
  provider: ProviderType;
  source: 'live' | 'mock';
  snapshotAt: Date;
  balance: number | null;
  requestCount: number | null;
  quotaLimit: number | null;
  quotaUsed: number | null;
  usageRate: number | null;
  requestCountMeta?: ProviderRequestCountMetaDraft | null;
  raw: Record<string, unknown>;
};

export interface ProviderAccountSource {
  readonly provider: ProviderType;
  fetchSnapshot(): Promise<ProviderSnapshotDraft>;
}
