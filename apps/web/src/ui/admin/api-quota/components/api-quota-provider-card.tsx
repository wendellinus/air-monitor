import React from 'react';
import * as echarts from 'echarts';
import { Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type {
  ProviderMetricKey,
  ProviderOverviewItem,
  ProviderTrendBucket,
  ProviderTrendData,
  ProviderTrendSeries,
  ProviderType,
} from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
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
  buildAreaOption,
  buildLineOption,
  formatMetricValue,
  formatNumber,
  rangeFromPreset,
} from '@/ui/admin/api-quota/lib/api-quota';

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

function describeRequestCountScope(
  locale: string,
  meta: ProviderOverviewItem['requestCountMeta'] | null | undefined,
): string | null {
  if (!meta) return null;

  const scopeLabel =
    meta.scope === 'today'
      ? textByLocale(locale, '今日累计请求数', 'Today request total')
      : meta.scope === 'month'
        ? textByLocale(locale, '当月累计请求数', 'Current month request total')
        : meta.scope === 'rolling'
          ? textByLocale(locale, '滚动窗口请求数', 'Rolling-window request total')
          : textByLocale(locale, '请求统计', 'Request metric');

  const sourceLabel =
    meta.source === 'stats.success_errors_hours'
      ? textByLocale(locale, '按逐时成功/失败请求汇总', 'Aggregated from hourly success/error stats')
      : meta.source === 'normalized_fields'
        ? textByLocale(locale, '按平台返回字段识别', 'Derived from provider summary fields')
        : meta.note ?? null;

  return sourceLabel ? `${scopeLabel} · ${sourceLabel}` : scopeLabel;
}

function getQweatherRequestCountLabel(locale: string, meta: ProviderOverviewItem['requestCountMeta'] | null | undefined): string {
  if (meta?.scope === 'month') return textByLocale(locale, '当月累计请求数', 'Current month request total');
  if (meta?.scope === 'rolling') return textByLocale(locale, '滚动窗口请求数', 'Rolling-window request total');
  if (meta?.scope === 'today') return textByLocale(locale, '今日累计请求数', 'Today request total');
  return textByLocale(locale, '请求次数', 'Request count');
}

function getRangeRequestCountLabel(input: {
  locale: string;
  t: TranslateFn;
  rangePreset: RangePreset;
  meta: ProviderOverviewItem['requestCountMeta'] | null | undefined;
}): string {
  const rangeLabel = input.t(`admin.apiQuota.range.${input.rangePreset}`);
  if (input.meta?.scope === 'rolling' || input.meta?.scope === 'month') {
    return textByLocale(input.locale, `${rangeLabel}请求增量`, `${rangeLabel} request increase`);
  }
  return textByLocale(input.locale, `${rangeLabel}累计请求数`, `${rangeLabel} request total`);
}

function getRangeAwareRequestCountValue(input: {
  fallback: number | null;
  meta: ProviderOverviewItem['requestCountMeta'] | null | undefined;
  series: ProviderTrendSeries | undefined;
}): number | null {
  const points = [...(input.series?.points ?? [])].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );
  if (points.length === 0) return input.fallback;

  if (input.meta?.scope === 'rolling' || input.meta?.scope === 'month') {
    const first = points[0]?.value ?? null;
    const last = points.at(-1)?.value ?? null;
    if (first !== null && last !== null) {
      const delta = last - first;
      if (Number.isFinite(delta) && delta >= 0) {
        return delta;
      }
    }
    return last;
  }

  const total = points.reduce((sum, point) => sum + point.value, 0);
  return Number.isFinite(total) ? total : input.fallback;
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
  pollingIntervalMs?: number;
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
  const effectiveRangePreset: RangePreset = isQweather ? '7d' : rangePreset;

  React.useEffect(() => {
    if (metricCandidates.includes(metricKey)) return;
    setMetricKey(metricCandidates[0] ?? 'requestCount');
  }, [metricCandidates, metricKey]);

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['admin-api-quota-trends', props.provider, metricKey, bucket, effectiveRangePreset],
    queryFn: async (): Promise<ProviderTrendData> => {
      const response = await api.get<ApiResponse<ProviderTrendData>>('/admin/provider-accounts/trends', {
        params: {
          provider: props.provider,
          metricKey,
          bucket,
          from: rangeFromPreset(effectiveRangePreset).toISOString(),
          to: new Date().toISOString(),
        },
      });
      return response.data.data;
    },
    refetchInterval: props.pollingIntervalMs ?? 60_000,
    placeholderData: (previousData) => previousData,
  });

  const { data: requestCountTrends } = useQuery({
    queryKey: ['admin-api-quota-request-count-trends', props.provider, bucket, effectiveRangePreset],
    queryFn: async (): Promise<ProviderTrendData> => {
      const response = await api.get<ApiResponse<ProviderTrendData>>('/admin/provider-accounts/trends', {
        params: {
          provider: props.provider,
          metricKey: 'requestCount',
          bucket,
          from: rangeFromPreset(effectiveRangePreset).toISOString(),
          to: new Date().toISOString(),
        },
      });
      return response.data.data;
    },
    enabled: !isQweather && metricKey !== 'requestCount',
    refetchInterval: props.pollingIntervalMs ?? 60_000,
    placeholderData: (previousData) => previousData,
  });

  const lineOption = React.useMemo(
    () => buildLineOption({ series: trends?.series, t: props.t, locale: props.locale }),
    [props.locale, props.t, trends?.series],
  );
  const areaOption = React.useMemo(
    () => buildAreaOption({ series: trends?.series, t: props.t, locale: props.locale }),
    [props.locale, props.t, trends?.series],
  );
  const donutOption = React.useMemo(
    () =>
      buildUsageDonutOption({
        locale: props.locale,
        usageRate: props.overviewItem?.usageRate ?? null,
      }),
    [props.locale, props.overviewItem?.usageRate],
  );

  const activeChartOption =
    chartType === 'line' ? lineOption : chartType === 'area' ? areaOption : donutOption;
  const metricName = props.t(`admin.apiQuota.metric.${metricKey}`);
  const requestCountSeries = React.useMemo(
    () =>
      (metricKey === 'requestCount' ? trends : requestCountTrends)?.series.find(
        (item) => item.provider === props.provider && item.metricKey === 'requestCount',
      ),
    [metricKey, props.provider, requestCountTrends, trends],
  );

  const requestCountValue = React.useMemo(() => {
    if (isQweather) return props.overviewItem?.requestCount ?? null;
    return getRangeAwareRequestCountValue({
      fallback: props.overviewItem?.requestCount ?? null,
      meta: props.overviewItem?.requestCountMeta,
      series: requestCountSeries,
    });
  }, [isQweather, props.overviewItem?.requestCount, props.overviewItem?.requestCountMeta, requestCountSeries]);

  const requestCountLabel = React.useMemo(() => {
    if (isQweather) {
      return getQweatherRequestCountLabel(props.locale, props.overviewItem?.requestCountMeta);
    }
    return getRangeRequestCountLabel({
      locale: props.locale,
      t: props.t,
      rangePreset: effectiveRangePreset,
      meta: props.overviewItem?.requestCountMeta,
    });
  }, [effectiveRangePreset, isQweather, props.locale, props.overviewItem?.requestCountMeta, props.t]);

  const metricRows = React.useMemo(() => {
    const item = props.overviewItem;
    if (!item || isQweather) return [];
    return [
      {
        key: 'requestCount',
        label: requestCountLabel,
        value: formatNumber(requestCountValue),
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
  }, [isQweather, props.overviewItem, props.t, requestCountLabel, requestCountValue]);

  const chartTabs = React.useMemo(
    () =>
      (isQweather
        ? [
            { title: props.t('admin.apiQuota.chartType.line'), value: 'line' },
            { title: props.t('admin.apiQuota.chartType.area'), value: 'area' },
          ]
        : [
            { title: props.t('admin.apiQuota.chartType.line'), value: 'line' },
            { title: props.t('admin.apiQuota.chartType.area'), value: 'area' },
            { title: props.t('admin.apiQuota.chartType.donut'), value: 'donut' },
          ]
      ).map((item) => ({
        ...item,
        content: <div className="hidden" />,
      })),
    [isQweather, props.t],
  );

  const hasNoPoints = (trends?.series ?? []).every((item) => item.points.length === 0);
  const requestCountHint = React.useMemo(
    () => describeRequestCountScope(props.locale, props.overviewItem?.requestCountMeta),
    [props.locale, props.overviewItem?.requestCountMeta],
  );

  return (
    <section className="h-full rounded-2xl bg-slate-50/80 p-4 md:p-5">
      <div className="space-y-1 pb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">
            {props.t(`admin.apiQuota.provider.${props.provider}`)}
          </h3>
          <Badge variant={props.overviewItem?.status === 'ok' ? 'success' : 'warning'} className="shrink-0">
            {props.overviewItem?.status === 'ok'
              ? props.t('admin.apiQuota.status.ok')
              : props.t('admin.apiQuota.status.degraded')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {props.overviewItem?.updatedAt
            ? props.t('admin.apiQuota.updatedAt', {
                time: new Date(props.overviewItem.updatedAt).toLocaleString(props.locale),
              })
            : props.t('admin.apiQuota.noData')}
        </p>
      </div>

      <div className="space-y-4">
        <div className={isQweather ? 'rounded-xl bg-white p-3 shadow-sm' : 'grid gap-2 rounded-xl bg-white p-3 shadow-sm md:grid-cols-[1fr_auto]'}>
          {!isQweather ? (
            <Select value={metricKey} onValueChange={(value: ProviderMetricKey) => setMetricKey(value)}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50">
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
          ) : (
            <div className="text-sm text-muted-foreground">
              {textByLocale(props.locale, '和风天气请求次数仅提供当天累计口径，已移除时间范围切换。', 'QWeather request count only supports today-based totals, so range switching was removed.')}
            </div>
          )}

          {!isQweather ? (
            <Select value={rangePreset} onValueChange={(value: RangePreset) => setRangePreset(value)}>
              <SelectTrigger className="h-9 border-slate-200 bg-slate-50">
                <SelectValue placeholder={props.t('admin.apiQuota.rangeLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{props.t('admin.apiQuota.range.7d')}</SelectItem>
                <SelectItem value="30d">{props.t('admin.apiQuota.range.30d')}</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {!props.overviewItem && props.overviewLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isQweather ? (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">{requestCountLabel}</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{formatNumber(requestCountValue)}</div>
            {requestCountHint ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{requestCountHint}</p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {metricRows.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
          <Tabs
            tabs={chartTabs}
            defaultValue={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
            motionPreset="admin"
            containerClassName="gap-2 rounded-lg bg-slate-100 p-1"
            tabClassName="min-w-[74px] rounded-md border border-transparent bg-transparent px-3 py-1.5 text-sm font-medium text-slate-600"
            activeTabClassName="border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.1)]"
            contentClassName="hidden"
          />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">
          {props.refreshPending ? (
            <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-background/90 p-1 shadow-sm">
              <Spinner className="h-4 w-4" />
            </div>
          ) : null}

          <div className="px-4 pt-3 text-sm font-medium text-slate-700">
            {props.t('admin.apiQuota.chartTitle', { metric: metricName })}
          </div>
          <div className="px-3 pb-3 pt-2">
            {!trends && trendsLoading && chartType !== 'donut' ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : (
              <EChartsViewport option={activeChartOption} className="h-[300px] w-full" />
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
      </div>
    </section>
  );
}
