import React from 'react';
import * as echarts from 'echarts';
import { Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type {
  ProviderMetricKey,
  ProviderMetricScope,
  ProviderOverviewItem,
  ProviderTrendBucket,
  ProviderTrendData,
  ProviderType,
} from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs } from '@/components/ui/tabs';
import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  type ChartType,
  type RangePreset,
  type TranslateFn,
  buildBarOption,
  buildLineOption,
  formatMetricValue,
  formatNumber,
  rangeFromPreset,
} from '@/ui/admin/api-quota/lib/api-quota';

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

function EChartsViewport(props: { option: echarts.EChartsOption; className?: string }): React.ReactNode {
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = echarts.init(host, undefined, { renderer: 'canvas' });
    chart.setOption(props.option, true);

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => chart.resize());

    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [props.option]);

  return <div ref={hostRef} className={props.className} />;
}

function buildUsageDonutOption(input: {
  locale: string;
  usageRate: number | null;
}): echarts.EChartsOption {
  const usage = Math.max(0, Math.min(1, input.usageRate ?? 0));
  const used = Number((usage * 100).toFixed(2));
  const remaining = Math.max(0, Number((100 - used).toFixed(2)));
  const usedLabel = textByLocale(input.locale, '已使用', 'Used');
  const remainingLabel = textByLocale(input.locale, '剩余', 'Remaining');

  return {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      data: [usedLabel, remainingLabel],
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '74%'],
        center: ['50%', '45%'],
        data: [
          {
            name: usedLabel,
            value: used,
            itemStyle: { color: '#2563eb' },
          },
          {
            name: remainingLabel,
            value: remaining,
            itemStyle: { color: '#16a34a' },
          },
        ],
        label: { formatter: '{b}: {d}%' },
      },
    ],
  };
}

function scopeLabel(locale: string, scope: ProviderMetricScope): string {
  if (scope === 'today') return textByLocale(locale, '今日', 'Today');
  if (scope === 'month') return textByLocale(locale, '本月', 'This month');
  if (scope === 'rolling') return textByLocale(locale, '滚动周期', 'Rolling');
  return textByLocale(locale, '未知', 'Unknown');
}

function sourceLabel(locale: string, source: string): string {
  if (source === 'normalized_fields') {
    return textByLocale(locale, '平台汇总接口', 'Provider summary API');
  }
  if (source === 'stats.success_errors_hours') {
    return textByLocale(locale, '统计接口 success/errors', 'Stats success/errors API');
  }
  if (source === 'mock_formula') {
    return textByLocale(locale, '本地模拟数据', 'Local mock data');
  }
  return textByLocale(locale, '平台接口', 'Provider API');
}

function getMetricCandidates(
  provider: ProviderType,
  item: ProviderOverviewItem | undefined,
): ProviderMetricKey[] {
  if (!item) return ['requestCount'];
  if (provider === 'qweather') return ['requestCount'];

  const list: ProviderMetricKey[] = ['requestCount'];
  if (item.quotaUsed !== null) list.push('quotaUsed');
  if (item.quotaLimit !== null) list.push('quotaLimit');
  if (item.usageRate !== null) list.push('usageRate');
  if (item.balance !== null) list.push('balance');
  return list;
}

type ApiQuotaProviderCardProps = {
  locale: string;
  t: TranslateFn;
  provider: ProviderType;
  overviewItem: ProviderOverviewItem | undefined;
  overviewLoading: boolean;
  refreshPending: boolean;
};

export function ApiQuotaProviderCard(props: ApiQuotaProviderCardProps): React.ReactNode {
  const isQweather = props.provider === 'qweather';
  const metricCandidates = React.useMemo(
    () => getMetricCandidates(props.provider, props.overviewItem),
    [props.overviewItem, props.provider],
  );
  const [metricKey, setMetricKey] = React.useState<ProviderMetricKey>('requestCount');
  const [rangePreset, setRangePreset] = React.useState<RangePreset>('7d');
  const [chartType, setChartType] = React.useState<ChartType>('line');
  const bucket: ProviderTrendBucket = 'day';

  React.useEffect(() => {
    if (metricCandidates.includes(metricKey)) return;
    setMetricKey(metricCandidates[0] ?? 'requestCount');
  }, [metricCandidates, metricKey]);

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['admin-api-quota-trends', props.provider, metricKey, bucket, rangePreset],
    queryFn: async (): Promise<ProviderTrendData> => {
      const response = await api.get<ApiResponse<ProviderTrendData>>('/admin/provider-accounts/trends', {
        params: {
          provider: props.provider,
          metricKey,
          bucket,
          from: rangeFromPreset(rangePreset).toISOString(),
          to: new Date().toISOString(),
        },
      });
      return response.data.data;
    },
    refetchInterval: 60_000,
    placeholderData: (previousData) => previousData,
  });

  const lineOption = React.useMemo(
    () => buildLineOption({ series: trends?.series, t: props.t, locale: props.locale }),
    [props.locale, props.t, trends?.series],
  );
  const barOption = React.useMemo(
    () => buildBarOption({ series: trends?.series, t: props.t }),
    [props.t, trends?.series],
  );
  const donutOption = React.useMemo(
    () =>
      buildUsageDonutOption({
        locale: props.locale,
        usageRate: props.overviewItem?.usageRate ?? null,
      }),
    [props.locale, props.overviewItem?.usageRate],
  );
  const activeChartOption = chartType === 'line' ? lineOption : chartType === 'bar' ? barOption : donutOption;
  const metricName = props.t(`admin.apiQuota.metric.${metricKey}`);

  const metricRows = React.useMemo(() => {
    const item = props.overviewItem;
    if (!item || isQweather) return [];
    return [
      {
        key: 'requestCount',
        label: props.t('admin.apiQuota.metric.requestCount'),
        value: formatNumber(item.requestCount),
      },
      ...(item.quotaUsed !== null || item.quotaLimit !== null
        ? [
            {
              key: 'quota',
              label: props.t('admin.apiQuota.metric.quota'),
              value: `${formatNumber(item.quotaUsed)} / ${formatNumber(item.quotaLimit)}`,
            },
          ]
        : []),
      ...(item.usageRate !== null
        ? [
            {
              key: 'usageRate',
              label: props.t('admin.apiQuota.metric.usageRate'),
              value: formatMetricValue('usageRate', item.usageRate),
            },
          ]
        : []),
      ...(item.balance !== null
        ? [
            {
              key: 'balance',
              label: props.t('admin.apiQuota.metric.balance'),
              value: formatMetricValue('balance', item.balance),
            },
          ]
        : []),
    ];
  }, [isQweather, props.overviewItem, props.t]);

  const chartTabs = React.useMemo(
    () =>
      (isQweather
        ? [
            { title: props.t('admin.apiQuota.chartType.line'), value: 'line' },
            { title: props.t('admin.apiQuota.chartType.bar'), value: 'bar' },
          ]
        : [
            { title: props.t('admin.apiQuota.chartType.line'), value: 'line' },
            { title: props.t('admin.apiQuota.chartType.bar'), value: 'bar' },
            { title: props.t('admin.apiQuota.chartType.donut'), value: 'donut' },
          ]
      ).map((item) => ({
        ...item,
        content: <div className="hidden" />,
      })),
    [isQweather, props.t],
  );

  const hasNoPoints = (trends?.series ?? []).every((item) => item.points.length === 0);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{props.t(`admin.apiQuota.provider.${props.provider}`)}</CardTitle>
          <Badge
            variant={props.overviewItem?.status === 'ok' ? 'success' : 'warning'}
            className="shrink-0"
          >
            {props.overviewItem?.status === 'ok'
              ? props.t('admin.apiQuota.status.ok')
              : props.t('admin.apiQuota.status.degraded')}
          </Badge>
        </div>
        <CardDescription>
          {props.overviewItem?.updatedAt
            ? props.t('admin.apiQuota.updatedAt', {
                time: new Date(props.overviewItem.updatedAt).toLocaleString(props.locale),
              })
            : props.t('admin.apiQuota.noData')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          {!isQweather ? (
            <Select
              value={metricKey}
              onValueChange={(value: ProviderMetricKey) => setMetricKey(value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={props.t('admin.apiQuota.metricLabel')} />
              </SelectTrigger>
              <SelectContent>
                {metricCandidates.map((item) => (
                  <SelectItem key={item} value={item}>
                    {props.t(`admin.apiQuota.metric.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={rangePreset} onValueChange={(value: RangePreset) => setRangePreset(value)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={props.t('admin.apiQuota.rangeLabel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{props.t('admin.apiQuota.range.7d')}</SelectItem>
              <SelectItem value="30d">{props.t('admin.apiQuota.range.30d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!props.overviewItem && props.overviewLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isQweather ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">{props.t('admin.apiQuota.metric.requestCount')}</div>
            <div className="mt-1 text-3xl font-semibold text-foreground">
              {formatNumber(props.overviewItem?.requestCount ?? null)}
            </div>
            {props.overviewItem?.requestCountMeta ? (
              <div className="mt-2 text-xs text-muted-foreground">
                {textByLocale(props.locale, '统计口径', 'Scope')}：
                {scopeLabel(props.locale, props.overviewItem.requestCountMeta.scope)}
                <span className="mx-1.5">·</span>
                {textByLocale(props.locale, '数据来源', 'Source')}：
                {sourceLabel(props.locale, props.overviewItem.requestCountMeta.source)}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {metricRows.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-md bg-muted/35 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-border/60 px-3 py-2">
          <Tabs
            tabs={chartTabs}
            defaultValue={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
            containerClassName="gap-2"
            tabClassName="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600"
            activeTabClassName="bg-slate-900"
            contentClassName="hidden"
          />
        </div>

        <div className="relative overflow-hidden rounded-lg border border-border/60">
          {props.refreshPending ? (
            <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-background/90 p-1 shadow-sm">
              <Spinner className="h-4 w-4" />
            </div>
          ) : null}

          <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">
            {props.t('admin.apiQuota.chartTitle', { metric: metricName })}
          </div>
          <div className="p-3">
            {!trends && trendsLoading && chartType !== 'donut' ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <EChartsViewport option={activeChartOption} className="h-[280px] w-full" />
            )}
          </div>
        </div>

        {chartType !== 'donut' && !trendsLoading && hasNoPoints ? (
          <Empty>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>{props.t('admin.apiQuota.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{props.t('admin.apiQuota.emptyDesc')}</EmptyDescription>
          </Empty>
        ) : null}
      </CardContent>
    </Card>
  );
}
