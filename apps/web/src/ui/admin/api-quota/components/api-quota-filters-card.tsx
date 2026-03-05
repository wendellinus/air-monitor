import React from 'react';
import type { ProviderMetricKey } from '@air-monitor/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type ProviderFilter,
  type RangePreset,
  METRIC_KEYS,
} from '@/ui/admin/api-quota/lib/api-quota';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type ApiQuotaFiltersCardProps = {
  t: TranslateFn;
  provider: ProviderFilter;
  metricKey: ProviderMetricKey;
  rangePreset: RangePreset;
  onProviderChange: (value: ProviderFilter) => void;
  onMetricChange: (value: ProviderMetricKey) => void;
  onRangeChange: (value: RangePreset) => void;
};

export function ApiQuotaFiltersCard(props: ApiQuotaFiltersCardProps): React.ReactNode {
  const { t } = props;
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('admin.apiQuota.filters')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={props.provider} onValueChange={(value: ProviderFilter) => props.onProviderChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.apiQuota.providerLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.apiQuota.provider.all')}</SelectItem>
              <SelectItem value="qweather">{t('admin.apiQuota.provider.qweather')}</SelectItem>
              <SelectItem value="amap">{t('admin.apiQuota.provider.amap')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={props.metricKey} onValueChange={(value: ProviderMetricKey) => props.onMetricChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.apiQuota.metricLabel')} />
            </SelectTrigger>
            <SelectContent>
              {METRIC_KEYS.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`admin.apiQuota.metric.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={props.rangePreset} onValueChange={(value: RangePreset) => props.onRangeChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.apiQuota.rangeLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('admin.apiQuota.range.7d')}</SelectItem>
              <SelectItem value="30d">{t('admin.apiQuota.range.30d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
