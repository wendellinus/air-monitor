import React from 'react';
import type { ProviderOverviewData } from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMetricValue, formatNumber } from '@/ui/admin/api-quota/lib/api-quota';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type ApiQuotaOverviewCardsProps = {
  t: TranslateFn;
  locale: string;
  overview: ProviderOverviewData | undefined;
  overviewLoading: boolean;
};

export function ApiQuotaOverviewCards(props: ApiQuotaOverviewCardsProps): React.ReactNode {
  const { t, locale, overview, overviewLoading } = props;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {!overview && overviewLoading
        ? [1, 2].map((item) => (
            <Card key={`skeleton-${item}`} className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        : (overview?.providers ?? []).map((item) => (
            <Card key={item.provider} className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t(`admin.apiQuota.provider.${item.provider}`)}</CardTitle>
                  <Badge variant={item.status === 'ok' ? 'success' : 'warning'}>
                    {item.status === 'ok'
                      ? t('admin.apiQuota.status.ok')
                      : t('admin.apiQuota.status.degraded')}
                  </Badge>
                </div>
                <CardDescription className="pt-0.5">
                  {item.updatedAt
                    ? t('admin.apiQuota.updatedAt', {
                        time: new Date(item.updatedAt).toLocaleString(locale),
                      })
                    : t('admin.apiQuota.noData')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                <div className="flex items-center justify-between rounded-md bg-muted/35 px-3 py-2">
                  <span className="text-muted-foreground">{t('admin.apiQuota.metric.requestCount')}</span>
                  <span className="font-medium">{formatNumber(item.requestCount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/35 px-3 py-2">
                  <span className="text-muted-foreground">{t('admin.apiQuota.metric.quota')}</span>
                  <span className="font-medium">
                    {formatNumber(item.quotaUsed)} / {formatNumber(item.quotaLimit)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/35 px-3 py-2">
                  <span className="text-muted-foreground">{t('admin.apiQuota.metric.usageRate')}</span>
                  <span className="font-medium">{formatMetricValue('usageRate', item.usageRate)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
    </div>
  );
}
