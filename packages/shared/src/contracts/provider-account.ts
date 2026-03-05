export type ProviderType = 'qweather' | 'amap';

export type ProviderMetricKey = 'requestCount' | 'quotaUsed' | 'quotaLimit' | 'usageRate' | 'balance';

export type ProviderTrendBucket = 'hour' | 'day';

export type ProviderStatus = 'ok' | 'degraded';

export type ProviderDataSource = 'live' | 'snapshot' | 'mock';

export type ProviderMetricScope = 'today' | 'month' | 'rolling' | 'unknown';

export type ProviderRequestCountMeta = {
  scope: ProviderMetricScope;
  source: string;
  snapshotAt: string;
  note?: string;
};

export type ProviderOverviewItem = {
  provider: ProviderType;
  displayName: string;
  balance: number | null;
  requestCount: number | null;
  quotaLimit: number | null;
  quotaUsed: number | null;
  usageRate: number | null;
  status: ProviderStatus;
  source: ProviderDataSource;
  updatedAt: string | null;
  requestCountMeta?: ProviderRequestCountMeta | null;
};

export type ProviderOverviewData = {
  generatedAt: string;
  providers: ProviderOverviewItem[];
  totals: {
    requestCount: number;
    quotaUsed: number;
    quotaLimit: number;
    usageRate: number | null;
  };
};

export type ProviderTrendPoint = {
  time: string;
  value: number;
};

export type ProviderTrendSeries = {
  provider: ProviderType;
  metricKey: ProviderMetricKey;
  bucket: ProviderTrendBucket;
  points: ProviderTrendPoint[];
};

export type ProviderTrendQuery = {
  provider?: ProviderType | 'all';
  metricKey?: ProviderMetricKey;
  bucket?: ProviderTrendBucket;
  from?: string;
  to?: string;
};

export type ProviderTrendData = {
  provider: ProviderType | 'all';
  metricKey: ProviderMetricKey;
  bucket: ProviderTrendBucket;
  from: string;
  to: string;
  series: ProviderTrendSeries[];
};

export type ProviderRefreshRequest = {
  providers?: ProviderType[];
};

export type ProviderRefreshData = {
  refreshedAt: string;
  providers: ProviderOverviewItem[];
  errors: Array<{
    provider: ProviderType;
    message: string;
  }>;
};
