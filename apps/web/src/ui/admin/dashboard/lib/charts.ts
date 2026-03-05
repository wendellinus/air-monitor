import type { EChartsOption } from 'echarts';
import type { NoticeAdminListData } from '@air-monitor/shared';

type NoticeStatus = 'active' | 'pending' | 'expired' | 'revoked' | 'unknown';

export function noticeStatusLabel(status: string, locale: string): string {
  const value: NoticeStatus =
    status === 'active' || status === 'pending' || status === 'expired' || status === 'revoked'
      ? status
      : 'unknown';

  if (!locale.startsWith('zh')) {
    if (value === 'active') return 'Active';
    if (value === 'pending') return 'Pending';
    if (value === 'expired') return 'Expired';
    if (value === 'revoked') return 'Revoked';
    return 'Unknown';
  }

  if (value === 'active') return '生效中';
  if (value === 'pending') return '待生效';
  if (value === 'expired') return '已过期';
  if (value === 'revoked') return '已撤销';
  return '未知状态';
}

function statusColor(name: string): string {
  const colorMap: Record<string, string> = {
    生效中: '#10b981',
    待生效: '#f59e0b',
    已过期: '#64748b',
    已撤销: '#ef4444',
    未知状态: '#94a3b8',
    Active: '#10b981',
    Pending: '#f59e0b',
    Expired: '#64748b',
    Revoked: '#ef4444',
    Unknown: '#94a3b8',
  };
  return colorMap[name] ?? '#3b82f6';
}

function formatPieTooltip(params: unknown): string {
  const value = (params ?? {}) as { name?: string; value?: unknown; percent?: unknown };
  const name = value.name ?? '-';
  const count = typeof value.value === 'number' ? value.value : Number(value.value ?? 0);
  const percent = typeof value.percent === 'number' ? value.percent : Number(value.percent ?? 0);
  return `${name}<br/>数量：${count}（${percent}%）`;
}

export function buildNoticeStatusSeriesData(
  list: NoticeAdminListData['list'],
  locale: string,
): Array<{ name: string; value: number }> {
  const statusBuckets = new Map<string, number>();
  for (const item of list) {
    statusBuckets.set(item.status, (statusBuckets.get(item.status) ?? 0) + 1);
  }
  return Array.from(statusBuckets.entries()).map(([name, value]) => ({
    name: noticeStatusLabel(name, locale),
    value,
  }));
}

export function buildStatusChartOption(
  noticeStatusSeriesData: Array<{ name: string; value: number }>,
): EChartsOption {
  const total = noticeStatusSeriesData.reduce((sum, item) => sum + item.value, 0);

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
      formatter: (params): string => formatPieTooltip(params),
    },
    color: noticeStatusSeriesData.map((item) => statusColor(item.name)),
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 14,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: String(total),
          fontSize: 28,
          fontWeight: 700,
          fill: '#0f172a',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '56%',
        style: {
          text: '公告总数',
          fontSize: 12,
          fill: '#64748b',
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['48%', '68%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(15, 23, 42, 0.08)',
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
        },
        data: noticeStatusSeriesData,
      },
    ],
  };
}

export function buildStatusChartCompactOption(
  noticeStatusSeriesData: Array<{ name: string; value: number }>,
): EChartsOption {
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    legend: { show: false },
    color: noticeStatusSeriesData.map((item) => statusColor(item.name)),
    series: [
      {
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        emphasis: {
          scale: true,
          scaleSize: 4,
        },
        data: noticeStatusSeriesData,
      },
    ],
  };
}

export function buildTrendChartOption(
  list: NoticeAdminListData['list'],
  locale: string,
): EChartsOption {
  const days = Array.from({ length: 7 }).map((_, idx) => new Date(Date.now() - (6 - idx) * 86400000));
  const labels = days.map((date) => date.toLocaleDateString(locale, { month: '2-digit', day: '2-digit' }));
  const countByDay = new Map(days.map((date) => [date.toISOString().slice(0, 10), 0]));

  for (const item of list) {
    const day = new Date(item.startTime).toISOString().slice(0, 10);
    if (countByDay.has(day)) countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#93c5fd' } },
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    grid: { left: 30, right: 16, top: 20, bottom: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: Array.from(countByDay.values()),
        lineStyle: { color: '#2563eb', width: 2.6 },
        itemStyle: { color: '#2563eb', borderColor: '#ffffff', borderWidth: 2 },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.28)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
            ],
          },
        },
      },
    ],
  };
}

export function buildTrendChartCompactOption(
  list: NoticeAdminListData['list'],
  locale: string,
): EChartsOption {
  const days = Array.from({ length: 7 }).map((_, idx) => new Date(Date.now() - (6 - idx) * 86400000));
  const labels = days.map((date) => date.toLocaleDateString(locale, { month: '2-digit', day: '2-digit' }));
  const countByDay = new Map(days.map((date) => [date.toISOString().slice(0, 10), 0]));

  for (const item of list) {
    const day = new Date(item.startTime).toISOString().slice(0, 10);
    if (countByDay.has(day)) countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#93c5fd' } },
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
      borderWidth: 1,
      textStyle: { color: '#f8fafc', fontSize: 12 },
    },
    grid: { left: 14, right: 8, top: 8, bottom: 18, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { fontSize: 10, color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { fontSize: 10, color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: Array.from(countByDay.values()),
        lineStyle: { color: '#2563eb', width: 2.2 },
        itemStyle: { color: '#2563eb', borderColor: '#ffffff', borderWidth: 1.5 },
        symbol: 'circle',
        symbolSize: 6,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.01)' },
            ],
          },
        },
      },
    ],
  };
}
