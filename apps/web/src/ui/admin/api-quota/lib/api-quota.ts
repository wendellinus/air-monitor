import type { EChartsOption } from 'echarts';
import type {
  ProviderMetricKey,
  ProviderOverviewData,
  ProviderTrendData,
  ProviderType,
} from '@air-monitor/shared';

export type ChartType = 'line' | 'area' | 'donut';
export type ProviderFilter = ProviderType | 'all';
export type RangePreset = '7d' | '30d';
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const METRIC_KEYS: ProviderMetricKey[] = [
  'requestCount',
  'quotaUsed',
  'quotaLimit',
  'usageRate',
  'balance',
];

export const PROVIDERS: ProviderType[] = ['qweather', 'amap'];

export function formatMetricValue(metricKey: ProviderMetricKey, value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '--';
  if (metricKey === 'usageRate') return `${(value * 100).toFixed(1)}%`;
  if (metricKey === 'balance') return value.toFixed(2);
  return value.toLocaleString();
}

export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '--';
  return value.toLocaleString();
}

export function rangeFromPreset(preset: RangePreset): Date {
  const now = Date.now();
  switch (preset) {
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case '7d':
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}

export function chartColor(provider: ProviderType): string {
  return provider === 'qweather' ? '#2563eb' : '#16a34a';
}

export function buildLineOption(input: {
  series?: ProviderTrendData['series'];
  t: TranslateFn;
  locale: string;
}): EChartsOption {
  const sourceSeries = input.series ?? [];
  const timeKeys = Array.from(
    new Set(sourceSeries.flatMap((series) => series.points.map((point) => point.time))),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      data: sourceSeries.map((series) => input.t(`admin.apiQuota.provider.${series.provider}`)),
    },
    grid: { top: 40, left: 20, right: 20, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: timeKeys.map((item) =>
        new Date(item).toLocaleString(input.locale, { month: '2-digit', day: '2-digit' }),
      ),
    },
    yAxis: { type: 'value' },
    series: sourceSeries.map((series) => {
      const byTime = new Map(series.points.map((point) => [point.time, point.value]));
      return {
        name: input.t(`admin.apiQuota.provider.${series.provider}`),
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: timeKeys.map((item) => byTime.get(item) ?? null),
        lineStyle: { width: 2.5, color: chartColor(series.provider) },
        itemStyle: { color: chartColor(series.provider) },
      };
    }),
  };
}

export function buildAreaOption(input: {
  series?: ProviderTrendData['series'];
  t: TranslateFn;
  locale: string;
}): EChartsOption {
  const sourceSeries = input.series ?? [];
  const timeKeys = Array.from(
    new Set(sourceSeries.flatMap((series) => series.points.map((point) => point.time))),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      data: sourceSeries.map((series) => input.t(`admin.apiQuota.provider.${series.provider}`)),
    },
    grid: { top: 40, left: 20, right: 20, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: timeKeys.map((item) =>
        new Date(item).toLocaleString(input.locale, { month: '2-digit', day: '2-digit' }),
      ),
    },
    yAxis: { type: 'value' },
    series: sourceSeries.map((series) => {
      const byTime = new Map(series.points.map((point) => [point.time, point.value]));
      return {
        name: input.t(`admin.apiQuota.provider.${series.provider}`),
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: timeKeys.map((item) => byTime.get(item) ?? null),
        areaStyle: {
          opacity: 0.22,
          color: chartColor(series.provider),
        },
        lineStyle: { width: 2, color: chartColor(series.provider) },
        itemStyle: { color: chartColor(series.provider) },
      };
    }),
  };
}

export function buildDonutOption(input: {
  providers?: ProviderOverviewData['providers'];
  t: TranslateFn;
}): EChartsOption {
  const items = input.providers ?? [];
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['48%', '74%'],
        center: ['50%', '45%'],
        data: items.map((item) => ({
          name: input.t(`admin.apiQuota.provider.${item.provider}`),
          value: Number((item.usageRate ?? 0) * 100),
          itemStyle: { color: chartColor(item.provider) },
        })),
        label: { formatter: '{b}: {d}%' },
      },
    ],
  };
}
