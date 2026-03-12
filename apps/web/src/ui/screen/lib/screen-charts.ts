import type * as echarts from 'echarts';
import type { AirHourlyItem, AirNowItem } from '@air-monitor/shared';

import { formatHourLabel, toNumber } from './screen-utils';

type HourlyPoint = {
  time: string;
  label: string;
  aqi: number;
  pm2p5: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  ms: number;
};

type RiskPoint = {
  name: string;
  probability: number;
  impact: number;
  score: number;
};

function getTimeValue(item: AirHourlyItem): string | undefined {
  const raw = item as Record<string, unknown>;
  if (typeof raw.fxTime === 'string') return raw.fxTime;
  if (typeof item.pubTime === 'string') return item.pubTime;
  if (typeof raw.updateTime === 'string') return raw.updateTime;
  return undefined;
}

function toHourlyPoint(item: AirHourlyItem): HourlyPoint | null {
  const raw = item as Record<string, unknown>;
  const time = getTimeValue(item);
  const ms = time ? new Date(time).getTime() : Number.NaN;
  if (!time || Number.isNaN(ms)) return null;

  return {
    time,
    label: formatHourLabel(time),
    aqi: toNumber(raw.aqi) ?? item.aqi ?? 0,
    pm2p5: toNumber(raw.pm2p5) ?? toNumber(raw.pm25) ?? item.pm2p5 ?? 0,
    pm10: toNumber(raw.pm10) ?? item.pm10 ?? 0,
    o3: toNumber(raw.o3) ?? item.o3 ?? 0,
    no2: toNumber(raw.no2) ?? item.no2 ?? 0,
    so2: toNumber(raw.so2) ?? item.so2 ?? 0,
    co: toNumber(raw.co) ?? item.co ?? 0,
    ms,
  };
}

function getHourlyPoints(airHourly: AirHourlyItem[], limit = 8): HourlyPoint[] {
  return airHourly
    .map(toHourlyPoint)
    .filter((item): item is HourlyPoint => item !== null)
    .sort((a, b) => a.ms - b.ms)
    .slice(-limit);
}

function getLabels(points: HourlyPoint[]): string[] {
  const labels = points.map((point) => point.label).filter((label) => label !== '-');
  const uniqueLabels = new Set(labels).size;
  if (labels.length > 1 && uniqueLabels === labels.length) {
    return points.map((point) => point.label);
  }

  return points.map((_, index) =>
    index === points.length - 1 ? '现在' : `T-${points.length - 1 - index}`,
  );
}

function hasMeaningfulValues(values: number[]): boolean {
  return values.some((value) => Number.isFinite(value) && value > 0);
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
            top: -18,
            style: {
              text: title,
              fill: '#f8fafc',
              fontSize: 16,
              fontWeight: 700,
            },
          },
          {
            type: 'text',
            top: 14,
            style: {
              text: description,
              fill: 'rgba(226,232,240,0.68)',
              fontSize: 12,
            },
          },
        ],
      },
    ],
  };
}

function quantile(values: number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  const current = sorted[base] ?? sorted[sorted.length - 1] ?? 0;
  const next = sorted[base + 1] ?? current;
  return current + rest * (next - current);
}

function riskImpactBucket(value: number): number {
  if (value <= 50) return 0;
  if (value <= 100) return 1;
  if (value <= 150) return 2;
  return 3;
}

function riskProbabilityBucket(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const baseline = Math.max(Math.abs(first), 1);
  const ratio = Math.abs(last - first) / baseline;
  if (ratio <= 0.08) return 0;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.35) return 2;
  return 3;
}

function pieRows(air: AirNowItem | null): Array<{ name: string; value: number; color: string }> {
  return [
    { name: 'PM2.5', value: air?.pm2p5 ?? 0, color: '#38bdf8' },
    { name: 'PM10', value: air?.pm10 ?? 0, color: '#22d3ee' },
    { name: 'NO2', value: air?.no2 ?? 0, color: '#f59e0b' },
    { name: 'SO2', value: air?.so2 ?? 0, color: '#a78bfa' },
    { name: 'CO', value: air?.co ?? 0, color: '#f97316' },
    { name: 'O3', value: air?.o3 ?? 0, color: '#34d399' },
  ];
}

export function buildAqiLineOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 8);
  const labels = getLabels(points);
  const values = points.map((point) => point.aqi);
  const peak = values.length > 0 ? Math.max(...values) : 0;

  if (points.length === 0 || !hasMeaningfulValues(values)) {
    return buildNoDataOption('暂无 AQI 小时趋势', '当前接口未返回可用的 AQI 小时数据');
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 20, bottom: 26, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.24)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.74)', margin: 10 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: Math.max(peak + 20, 80),
      axisLabel: { color: 'rgba(226,232,240,0.74)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    series: [
      {
        name: 'AQI',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: values,
        lineStyle: { width: 3, color: '#67e8f9' },
        itemStyle: {
          color: '#e0f2fe',
          borderColor: '#22d3ee',
          borderWidth: 2,
        },
      },
    ],
  };
}

export function buildAqiAreaOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 8);
  const labels = getLabels(points);
  const values = points.map((point) => point.aqi);
  const peak = values.length > 0 ? Math.max(...values) : 0;

  if (points.length === 0 || !hasMeaningfulValues(values)) {
    return buildNoDataOption('暂无 AQI 面积趋势', '当前接口未返回可用的 AQI 小时数据');
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 20, bottom: 26, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.24)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.74)' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: Math.max(peak + 20, 80),
      axisLabel: { color: 'rgba(226,232,240,0.74)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    series: [
      {
        name: 'AQI',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: values,
        lineStyle: { width: 2.5, color: '#38bdf8' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(56,189,248,0.42)' },
              { offset: 1, color: 'rgba(15,23,42,0.02)' },
            ],
          },
        },
      },
    ],
  };
}

export function buildAqiComboOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 8);
  const labels = getLabels(points);
  const aqiValues = points.map((point) => point.aqi);
  const pm2p5Values = points.map((point) => point.pm2p5);

  if (points.length === 0 || !hasMeaningfulValues(aqiValues)) {
    return buildNoDataOption('暂无 AQI 组合趋势', '当前接口未返回可用的 AQI 小时数据');
  }

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: 'rgba(226,232,240,0.72)' },
      data: ['PM2.5', 'AQI'],
    },
    grid: { left: 40, right: 18, top: 34, bottom: 22, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.24)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.7)' },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: 'rgba(226,232,240,0.7)' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
      },
      {
        type: 'value',
        axisLabel: { color: 'rgba(226,232,240,0.7)' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'PM2.5',
        type: 'bar',
        barWidth: 16,
        data: pm2p5Values,
        itemStyle: {
          color: '#22d3ee',
          borderRadius: [8, 8, 0, 0],
        },
      },
      {
        name: 'AQI',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbolSize: 6,
        data: aqiValues,
        lineStyle: { width: 2.5, color: '#f59e0b' },
        itemStyle: { color: '#fde68a' },
      },
    ],
  };
}

export function buildAqiGaugeOption(air: AirNowItem | null): echarts.EChartsOption {
  const value = Math.max(0, Math.min(300, air?.aqi ?? 0));
  const label =
    value <= 50 ? '优' : value <= 100 ? '良' : value <= 150 ? '轻度' : value <= 200 ? '中度' : value <= 300 ? '重度' : '严重';

  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        min: 0,
        max: 300,
        center: ['50%', '58%'],
        startAngle: 210,
        endAngle: -30,
        splitNumber: 6,
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.17, '#22c55e'],
              [0.33, '#84cc16'],
              [0.5, '#f59e0b'],
              [0.67, '#f97316'],
              [1, '#ef4444'],
            ],
          },
        },
        pointer: {
          itemStyle: { color: '#e2e8f0' },
          length: '68%',
          width: 4,
        },
        progress: { show: false },
        axisTick: { distance: -22, length: 5, lineStyle: { color: 'rgba(255,255,255,0.5)' } },
        splitLine: {
          distance: -24,
          length: 14,
          lineStyle: { color: 'rgba(255,255,255,0.68)', width: 2 },
        },
        axisLabel: { distance: -2, color: 'rgba(226,232,240,0.7)', fontSize: 10 },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '32%'],
          formatter: (currentValue: number) => `{value|${Math.round(currentValue)}}\n{label|${label}}`,
          rich: {
            value: { fontSize: 30, fontWeight: 700, color: '#f8fafc', lineHeight: 34 },
            label: { fontSize: 12, color: 'rgba(226,232,240,0.72)', lineHeight: 16 },
          },
        },
        title: {
          offsetCenter: [0, '74%'],
          color: 'rgba(226,232,240,0.62)',
          fontSize: 11,
        },
        data: [{ value, name: '实时 AQI' }],
      } as echarts.GaugeSeriesOption,
    ],
  };
}

export function buildAqiRingOption(air: AirNowItem | null): echarts.EChartsOption {
  const current = Math.max(0, Math.min(300, air?.aqi ?? 0));
  const remain = Math.max(0, 300 - current);

  return {
    backgroundColor: 'transparent',
    title: {
      text: `${Math.round(current)}`,
      subtext: 'AQI / 300',
      left: 'center',
      top: '40%',
      textStyle: { color: '#f8fafc', fontSize: 30, fontWeight: 700 },
      subtextStyle: { color: 'rgba(226,232,240,0.66)', fontSize: 12 },
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '74%'],
        center: ['50%', '56%'],
        label: { show: false },
        data: [
          { value: current, name: '当前值', itemStyle: { color: '#22d3ee' } },
          { value: remain, name: '剩余区间', itemStyle: { color: 'rgba(148,163,184,0.18)' } },
        ],
      },
    ],
  };
}

export function buildPollutantBarOption(air: AirNowItem | null): echarts.EChartsOption {
  const rows = pieRows(air);
  const hasData = hasMeaningfulValues(rows.map((row) => row.value));

  if (!hasData) {
    return buildNoDataOption('暂无污染物对比', '当前实时污染物数据为空');
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 18, right: 18, top: 18, bottom: 22, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(226,232,240,0.7)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.name),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.85)' },
    },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: rows.map((row) => ({
          value: row.value,
          itemStyle: { color: row.color, borderRadius: [999, 999, 999, 999] },
        })),
      },
    ],
  };
}

export function buildPollutantStackedOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 6);
  const labels = getLabels(points);
  const pm2p5Values = points.map((point) => point.pm2p5);
  const pm10Values = points.map((point) => point.pm10);
  const o3Values = points.map((point) => point.o3);
  const hasPollutantTimeline =
    hasMeaningfulValues(pm2p5Values) || hasMeaningfulValues(pm10Values) || hasMeaningfulValues(o3Values);

  if (points.length === 0 || !hasPollutantTimeline) {
    return buildNoDataOption('暂无小时污染物趋势', '当前账号或接口未返回可用的小时污染物数据');
  }

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: 'rgba(226,232,240,0.72)' },
      data: ['PM2.5', 'PM10', 'O3'],
    },
    grid: { left: 18, right: 18, top: 34, bottom: 22, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.24)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    series: [
      {
        name: 'PM2.5',
        type: 'bar',
        stack: 'total',
        data: pm2p5Values,
        itemStyle: { color: '#38bdf8' },
      },
      {
        name: 'PM10',
        type: 'bar',
        stack: 'total',
        data: pm10Values,
        itemStyle: { color: '#22d3ee' },
      },
      {
        name: 'O3',
        type: 'bar',
        stack: 'total',
        data: o3Values,
        itemStyle: { color: '#34d399' },
      },
    ],
  };
}

export function buildPollutantPieOption(air: AirNowItem | null): echarts.EChartsOption {
  const rows = pieRows(air);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (total <= 0) {
    return buildNoDataOption('暂无污染物构成', '当前实时污染物数据为空');
  }

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 0,
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: 'rgba(226,232,240,0.72)' },
    },
    title: {
      text: `${Math.round(total)}`,
      subtext: '总浓度',
      left: '32%',
      top: '39%',
      textAlign: 'center',
      textStyle: { color: '#f8fafc', fontSize: 24, fontWeight: 700 },
      subtextStyle: { color: 'rgba(226,232,240,0.62)', fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['32%', '48%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        data: rows.map((row) => ({
          name: row.name,
          value: row.value,
          itemStyle: { color: row.color },
        })),
      },
    ],
  };
}

export function buildPollutantRadarOption(air: AirNowItem | null): echarts.EChartsOption {
  const rows = [
    { name: 'PM2.5', value: air?.pm2p5 ?? 0, max: 120 },
    { name: 'PM10', value: air?.pm10 ?? 0, max: 150 },
    { name: 'NO2', value: air?.no2 ?? 0, max: 120 },
    { name: 'SO2', value: air?.so2 ?? 0, max: 80 },
    { name: 'CO', value: air?.co ?? 0, max: 10 },
    { name: 'O3', value: air?.o3 ?? 0, max: 120 },
  ];

  if (!hasMeaningfulValues(rows.map((row) => row.value))) {
    return buildNoDataOption('暂无污染物雷达图', '当前实时污染物数据为空');
  }

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    radar: {
      center: ['50%', '54%'],
      radius: '62%',
      splitNumber: 4,
      axisName: { color: 'rgba(226,232,240,0.8)', fontSize: 11 },
      splitArea: { areaStyle: { color: ['rgba(15,23,42,0.04)', 'rgba(30,41,59,0.08)'] } },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.16)' } },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } },
      indicator: rows.map((row) => ({ name: row.name, max: row.max })),
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: rows.map((row) => row.value),
            name: '污染物分布',
            lineStyle: { color: '#67e8f9', width: 2.5 },
            itemStyle: { color: '#22d3ee' },
            areaStyle: { color: 'rgba(34,211,238,0.18)' },
          },
        ],
      },
    ],
  };
}

export function buildAqiBoxplotOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const values = getHourlyPoints(airHourly, 12).map((point) => point.aqi);
  const filteredValues = values.filter((value) => Number.isFinite(value) && value > 0);

  if (filteredValues.length === 0) {
    return buildNoDataOption('暂无 AQI 波动分布', '当前接口未返回可用的 AQI 小时数据');
  }

  const low = Math.min(...filteredValues);
  const high = Math.max(...filteredValues);
  const q1 = quantile(filteredValues, 0.25);
  const median = quantile(filteredValues, 0.5);
  const q3 = quantile(filteredValues, 0.75);

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    grid: { left: 28, right: 18, top: 22, bottom: 22, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['AQI 分布'],
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.24)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    series: [
      {
        type: 'boxplot',
        data: [[low, q1, median, q3, high]],
        itemStyle: {
          color: 'rgba(34,211,238,0.16)',
          borderColor: '#67e8f9',
        },
      },
    ],
  };
}

export function buildHourlyHeatmapOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 8);
  const labels = getLabels(points);
  const metricNames = ['AQI', 'PM2.5', 'PM10', 'O3'];
  const metricValues = [
    points.map((point) => point.aqi),
    points.map((point) => point.pm2p5),
    points.map((point) => point.pm10),
    points.map((point) => point.o3),
  ];

  const hasHeatmapData = metricValues.some((values) => hasMeaningfulValues(values));
  if (points.length === 0 || !hasHeatmapData) {
    return buildNoDataOption('暂无热力图数据', '当前接口未返回可用的小时指标数据');
  }

  const data = metricValues.flatMap((values, rowIndex) =>
    values.map((value, colIndex) => [colIndex, rowIndex, Math.round(value)]),
  );
  const maxValue = Math.max(...data.map((item) => Number(item[2])), 1);

  return {
    backgroundColor: 'transparent',
    tooltip: { position: 'top' },
    grid: { left: 24, right: 24, top: 18, bottom: 56, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
    },
    yAxis: {
      type: 'category',
      data: metricNames,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } },
      axisLabel: { color: 'rgba(226,232,240,0.78)' },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      textStyle: { color: 'rgba(226,232,240,0.68)' },
      inRange: { color: ['#0f172a', '#0ea5e9', '#67e8f9'] },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: { show: true, color: 'rgba(248,250,252,0.88)' },
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(15,23,42,0.45)',
          },
        },
      },
    ],
  };
}

export function buildPollutantScatterOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 8);
  const pm2p5Values = points.map((point) => point.pm2p5);
  const o3Values = points.map((point) => point.o3);

  if (points.length === 0 || !hasMeaningfulValues(pm2p5Values) || !hasMeaningfulValues(o3Values)) {
    return buildNoDataOption('暂无散点分析', '当前接口未返回可用于相关性分析的小时污染物数据');
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const data = ((params as { data?: unknown }).data ?? []) as Array<number | string>;
        const pm2p5 = Number(data[0] ?? 0);
        const o3 = Number(data[1] ?? 0);
        const aqi = Number(data[2] ?? 0);
        const label = String(data[3] ?? '-');
        return `${label}<br/>PM2.5: ${pm2p5}<br/>O3: ${o3}<br/>AQI: ${aqi}`;
      },
    },
    grid: { left: 24, right: 18, top: 18, bottom: 22, containLabel: true },
    xAxis: {
      type: 'value',
      name: 'PM2.5',
      nameTextStyle: { color: 'rgba(226,232,240,0.68)' },
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    yAxis: {
      type: 'value',
      name: 'O3',
      nameTextStyle: { color: 'rgba(226,232,240,0.68)' },
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    series: [
      {
        type: 'scatter',
        data: points.map((point) => [point.pm2p5, point.o3, point.aqi, point.label]),
        symbolSize: (value: number[]) => Math.max(10, Math.min(28, (value[2] ?? 0) / 6)),
        itemStyle: {
          color: 'rgba(34,211,238,0.75)',
          borderColor: '#bae6fd',
          borderWidth: 1.5,
        },
      },
    ],
  };
}

export function buildRiskMatrixOption(air: AirNowItem | null, airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 8);
  const riskPoints: RiskPoint[] = [
    {
      name: 'AQI',
      probability: riskProbabilityBucket(points.map((point) => point.aqi)),
      impact: riskImpactBucket(air?.aqi ?? 0),
      score: air?.aqi ?? 0,
    },
    {
      name: 'PM2.5',
      probability: riskProbabilityBucket(points.map((point) => point.pm2p5)),
      impact: riskImpactBucket(air?.pm2p5 ?? 0),
      score: air?.pm2p5 ?? 0,
    },
    {
      name: 'O3',
      probability: riskProbabilityBucket(points.map((point) => point.o3)),
      impact: riskImpactBucket(air?.o3 ?? 0),
      score: air?.o3 ?? 0,
    },
  ];

  const levels = ['低', '中', '高', '极高'];
  const heatmapData = Array.from({ length: 4 }, (_, y) =>
    Array.from({ length: 4 }, (_, x) => [x, y, (x + 1) * (y + 1)]),
  ).flat();

  return {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item' },
    grid: { left: 34, right: 26, top: 28, bottom: 36, containLabel: true },
    xAxis: {
      type: 'category',
      name: '发生概率',
      nameTextStyle: { color: 'rgba(226,232,240,0.68)' },
      data: levels,
      splitArea: { show: true },
      axisLabel: { color: 'rgba(226,232,240,0.76)' },
    },
    yAxis: {
      type: 'category',
      name: '影响等级',
      nameTextStyle: { color: 'rgba(226,232,240,0.68)' },
      data: levels,
      splitArea: { show: true },
      axisLabel: { color: 'rgba(226,232,240,0.76)' },
    },
    visualMap: {
      min: 1,
      max: 16,
      show: false,
      inRange: {
        color: [
          'rgba(34,197,94,0.18)',
          'rgba(250,204,21,0.22)',
          'rgba(249,115,22,0.24)',
          'rgba(239,68,68,0.28)',
        ],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: heatmapData,
        silent: true,
      },
      {
        type: 'scatter',
        data: riskPoints.map((point) => ({
          name: point.name,
          value: [point.probability, point.impact, point.score],
        })),
        symbolSize: (value: number[]) => Math.max(14, Math.min(24, Number(value[2]) / 6)),
        label: {
          show: true,
          position: 'inside',
          formatter: (params: unknown) => {
            const data = (params as { data?: { name?: string } }).data;
            return data?.name ?? '';
          },
          color: '#f8fafc',
          fontSize: 10,
          fontWeight: 600,
        },
        itemStyle: {
          color: '#67e8f9',
          borderColor: '#e0f2fe',
          borderWidth: 1.5,
        },
      },
    ],
  };
}

export function buildSpatialTrendOption(airHourly: AirHourlyItem[]): echarts.EChartsOption {
  const points = getHourlyPoints(airHourly, 7);
  const labels = getLabels(points);
  const values = points.map((point) => point.aqi);

  if (points.length === 0 || !hasMeaningfulValues(values)) {
    return buildNoDataOption('暂无空间趋势图', '当前接口未返回可用的 AQI 小时数据');
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 24, right: 18, top: 20, bottom: 24, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.24)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'rgba(226,232,240,0.72)' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.12)' } },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 18,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#38bdf8' },
              { offset: 1, color: '#0ea5e9' },
            ],
          },
          borderRadius: [6, 6, 0, 0],
          shadowBlur: 12,
          shadowColor: 'rgba(14,165,233,0.28)',
        },
      },
      {
        type: 'pictorialBar',
        symbol: 'diamond',
        symbolSize: [18, 8],
        symbolOffset: [0, '-50%'],
        z: 12,
        data: values,
        itemStyle: { color: '#7dd3fc' },
      },
    ],
  };
}
