import type * as echarts from 'echarts';

import type { AirHourlyItem } from '@air-monitor/shared';

import type { CompareCityDataset } from '@/ui/plan/hooks/use-city-compare-data';
import { formatHourLabel, toNumber } from '@/ui/screen/lib/screen-utils';

type ComparePoint = {
  label: string;
  time: string;
  aqi: number;
  pm2p5: number;
  pm10: number;
  o3: number;
  ms: number;
};

function getTimeValue(item: AirHourlyItem): string | null {
  const raw = item as Record<string, unknown>;
  if (typeof raw.fxTime === 'string') return raw.fxTime;
  if (typeof item.pubTime === 'string') return item.pubTime;
  if (typeof raw.updateTime === 'string') return raw.updateTime;
  return null;
}

function toComparePoint(item: AirHourlyItem): ComparePoint | null {
  const time = getTimeValue(item);
  if (!time) return null;
  const ms = new Date(time).getTime();
  if (Number.isNaN(ms)) return null;

  return {
    label: formatHourLabel(time),
    time,
    aqi: toNumber(item.aqi) ?? 0,
    pm2p5: toNumber(item.pm2p5) ?? toNumber((item as Record<string, unknown>).pm25) ?? 0,
    pm10: toNumber(item.pm10) ?? 0,
    o3: toNumber(item.o3) ?? 0,
    ms,
  };
}

function getComparePoints(hourly: AirHourlyItem[]): ComparePoint[] {
  return hourly
    .map(toComparePoint)
    .filter((item): item is ComparePoint => item !== null)
    .sort((a, b) => a.ms - b.ms)
    .slice(-8);
}

function buildNoDataOption(title: string, description: string): echarts.EChartsOption {
  return {
    backgroundColor: 'transparent',
    xAxis: { show: false, min: 0, max: 1 },
    yAxis: { show: false, min: 0, max: 1 },
    series: [],
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: 'middle',
        children: [
          {
            type: 'text',
            top: -14,
            style: {
              text: title,
              fill: '#0f172a',
              fontSize: 16,
              fontWeight: 700,
            },
          },
          {
            type: 'text',
            top: 14,
            style: {
              text: description,
              fill: 'rgba(71,85,105,0.78)',
              fontSize: 12,
            },
          },
        ],
      },
    ],
  };
}

export function buildCompareTrendOption(datasets: CompareCityDataset[]): echarts.EChartsOption {
  const chartRows = datasets.map((dataset) => ({
    name: dataset.city.name,
    points: getComparePoints(dataset.hourly),
  }));
  const labels = Array.from(
    new Set(
      chartRows.flatMap((row) => row.points.map((point) => point.label)),
    ),
  );

  if (labels.length === 0) {
    return buildNoDataOption('暂无对比趋势', '至少需要两座城市的小时 AQI 数据才能形成趋势对比。');
  }

  const palette = ['#2563eb', '#0f766e', '#ea580c', '#7c3aed'];

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: 'rgba(51,65,85,0.76)' },
    },
    grid: { left: 38, right: 16, top: 38, bottom: 26, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.28)' } },
      axisLabel: { color: 'rgba(71,85,105,0.78)' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(71,85,105,0.78)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.14)' } },
    },
    series: chartRows.map((row, index) => {
      const pointMap = new Map(row.points.map((point) => [point.label, point.aqi]));
      return {
        name: row.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: labels.map((label) => pointMap.get(label) ?? null),
        lineStyle: { width: 3, color: palette[index % palette.length] },
        itemStyle: {
          color: '#ffffff',
          borderWidth: 2,
          borderColor: palette[index % palette.length],
        },
      };
    }),
  };
}

export function buildCompareBarOption(datasets: CompareCityDataset[]): echarts.EChartsOption {
  const rows = datasets.filter((dataset) => dataset.airNow !== null);
  if (rows.length === 0) {
    return buildNoDataOption('暂无城市指标对比', '当前没有可用的实时空气质量数据。');
  }

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: 'rgba(51,65,85,0.76)' },
      data: ['AQI', 'PM2.5', 'O3'],
    },
    grid: { left: 36, right: 16, top: 38, bottom: 26, containLabel: true },
    xAxis: {
      type: 'category',
      data: rows.map((dataset) => dataset.city.name),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.28)' } },
      axisLabel: { color: 'rgba(71,85,105,0.78)' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(71,85,105,0.78)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.14)' } },
    },
    series: [
      {
        name: 'AQI',
        type: 'bar',
        barGap: '18%',
        itemStyle: { color: '#2563eb', borderRadius: [10, 10, 0, 0] },
        data: rows.map((dataset) => dataset.airNow?.aqi ?? 0),
      },
      {
        name: 'PM2.5',
        type: 'bar',
        itemStyle: { color: '#0f766e', borderRadius: [10, 10, 0, 0] },
        data: rows.map((dataset) => dataset.airNow?.pm2p5 ?? 0),
      },
      {
        name: 'O3',
        type: 'bar',
        itemStyle: { color: '#ea580c', borderRadius: [10, 10, 0, 0] },
        data: rows.map((dataset) => dataset.airNow?.o3 ?? 0),
      },
    ],
  };
}

export function buildCompareRadarOption(datasets: CompareCityDataset[]): echarts.EChartsOption {
  const rows = datasets.filter((dataset) => dataset.airNow !== null);
  if (rows.length === 0) {
    return buildNoDataOption('暂无多维雷达对比', '当前没有可用的实时污染物结构数据。');
  }

  const palette = ['#2563eb', '#0f766e', '#ea580c', '#7c3aed'];

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      textStyle: { color: 'rgba(51,65,85,0.76)' },
    },
    radar: {
      center: ['50%', '48%'],
      radius: '60%',
      splitNumber: 4,
      axisName: { color: 'rgba(51,65,85,0.82)', fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(241,245,249,0.85)', 'rgba(226,232,240,0.45)'] } },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
      indicator: [
        { name: 'PM2.5', max: 180 },
        { name: 'PM10', max: 220 },
        { name: 'NO2', max: 180 },
        { name: 'SO2', max: 120 },
        { name: 'O3', max: 220 },
      ],
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: rows.map((dataset, index) => ({
          value: [
            dataset.airNow?.pm2p5 ?? 0,
            dataset.airNow?.pm10 ?? 0,
            dataset.airNow?.no2 ?? 0,
            dataset.airNow?.so2 ?? 0,
            dataset.airNow?.o3 ?? 0,
          ],
          name: dataset.city.name,
          lineStyle: { color: palette[index % palette.length], width: 2.5 },
          itemStyle: { color: palette[index % palette.length] },
          areaStyle: {
            color:
              index === 0
                ? 'rgba(37,99,235,0.12)'
                : index === 1
                  ? 'rgba(15,118,110,0.1)'
                  : index === 2
                    ? 'rgba(234,88,12,0.1)'
                    : 'rgba(124,58,237,0.1)',
          },
        })),
      },
    ],
  };
}
