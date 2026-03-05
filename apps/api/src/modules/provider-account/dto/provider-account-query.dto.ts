import { IsIn, IsISO8601, IsOptional } from 'class-validator';

import type { ProviderMetricKey, ProviderTrendBucket, ProviderTrendQuery, ProviderType } from '@air-monitor/shared';

const PROVIDER_VALUES: Array<ProviderType | 'all'> = ['all', 'qweather', 'amap'];
const METRIC_VALUES: ProviderMetricKey[] = ['requestCount', 'quotaUsed', 'quotaLimit', 'usageRate', 'balance'];
const BUCKET_VALUES: ProviderTrendBucket[] = ['hour', 'day'];

export class ProviderAccountQueryDto implements ProviderTrendQuery {
  @IsOptional()
  @IsIn(PROVIDER_VALUES)
  provider?: ProviderType | 'all';

  @IsOptional()
  @IsIn(METRIC_VALUES)
  metricKey?: ProviderMetricKey;

  @IsOptional()
  @IsIn(BUCKET_VALUES)
  bucket?: ProviderTrendBucket;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
