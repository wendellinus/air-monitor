import type * as echarts from 'echarts';
import type { AirHourlyItem, AirNowItem } from '@air-monitor/shared';

import { formatHourLabel, toNumber } from './screen-utils';

export function buildTrendOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = airHourly
    .map((x) => {
      const time =
        typeof (x as Record<string, unknown>)['fxTime'] === 'string'
          ? ((x as Record<string, unknown>)['fxTime'] as string)
          : typeof x.pubTime === 'string'
            ? x.pubTime
            : typeof (x as Record<string, unknown>)['updateTime'] === 'string'
              ? ((x as Record<string, unknown>)['updateTime'] as string)
              : undefined;
      const aqi =
        toNumber((x as Record<string, unknown>)['aqi']) ?? (typeof x.aqi === 'number' ? x.aqi : null);
      const ms = time ? new Date(time).getTime() : Number.NaN;
      return time && aqi !== null && !Number.isNaN(ms) ? { time, aqi, ms } : null;
    })
    .filter((v): v is { time: string; aqi: number; ms: number } => v !== null)
    .sort((a, b) => a.ms - b.ms)
    .slice(-5);

  const labels = points.map((p) => formatHourLabel(p.time));
  const uniqueLabels = new Set(labels.filter((x) => x !== '-')).size;
  const x =
    uniqueLabels >= 2
      ? labels
      : points.map((_, i) => (i === points.length - 1 ? 'now' : `-${points.length - 1 - i}h`));
  const y = points.map((p) => p.aqi);

  return {
    backgroundColor: 'transparent',
    grid: { left: 54, right: 18, top: 26, bottom: 46 },
    xAxis: {
      type: 'category',
      data: x,
      name: '时间(h)',
      nameGap: 22,
      nameTextStyle: { color: 'rgba(255,255,255,0.60)' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.20)' } },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      name: 'AQI(指数)',
      nameGap: 34,
      nameTextStyle: { color: 'rgba(255,255,255,0.60)' },
      axisLine: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.65)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.10)' } },
    },
    series: [
      {
        type: 'line',
        data: y,
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2, color: '#4dd4ff' },
        areaStyle: { color: 'rgba(77,212,255,0.14)' },
      },
    ],
    tooltip: { trigger: 'axis' },
  };
}

export function buildPollutantOption(air: AirNowItem | null): echarts.EChartsOption {
  const rows: Array<{ name: string; value: number }> = [
    { name: 'PM2.5', value: air?.pm2p5 ?? 0 },
    { name: 'PM10', value: air?.pm10 ?? 0 },
    { name: 'NO2', value: air?.no2 ?? 0 },
    { name: 'SO2', value: air?.so2 ?? 0 },
    { name: 'CO', value: air?.co ?? 0 },
    { name: 'O3', value: air?.o3 ?? 0 },
  ];

  return {
    backgroundColor: 'transparent',
    grid: { left: 74, right: 18, top: 24, bottom: 30 },
    xAxis: {
      type: 'value',
      name: '浓度(μg/m³)\nCO: mg/m³',
      nameGap: 22,
      nameTextStyle: { color: 'rgba(255,255,255,0.58)' },
      axisLabel: { color: 'rgba(255,255,255,0.60)' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.10)' } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((r) => r.name),
      name: '污染物(类别)',
      nameGap: 36,
      nameTextStyle: { color: 'rgba(255,255,255,0.58)' },
      axisLabel: { color: 'rgba(255,255,255,0.75)' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: rows.map((r) => r.value),
        barWidth: 10,
        itemStyle: {
          borderRadius: [8, 8, 8, 8],
          color: 'rgba(77,212,255,0.55)',
        },
      },
    ],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  };
}
