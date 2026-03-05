import React from 'react';
import type { DashboardWidgetId, NoticeAdminListData } from '@air-monitor/shared';

import {
  buildNoticeStatusSeriesData,
  buildStatusChartCompactOption,
  buildStatusChartOption,
  buildTrendChartCompactOption,
  buildTrendChartOption,
} from '@/ui/admin/dashboard/lib/charts';
import { textByLocale } from '@/ui/admin/dashboard/lib/layout';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type DashboardWidgetConfig = {
  widgetTitles: Record<DashboardWidgetId, string>;
  statusChartOption: ReturnType<typeof buildStatusChartOption>;
  statusChartCompactOption: ReturnType<typeof buildStatusChartCompactOption>;
  trendChartOption: ReturnType<typeof buildTrendChartOption>;
  trendChartCompactOption: ReturnType<typeof buildTrendChartCompactOption>;
};

export function useDashboardWidgetConfig(
  input: {
    t: TranslateFn;
    locale: string;
    noticeSample: NoticeAdminListData['list'];
  },
): DashboardWidgetConfig {
  const { t, locale, noticeSample } = input;

  const noticeStatusSeriesData = React.useMemo(
    () => buildNoticeStatusSeriesData(noticeSample, locale),
    [locale, noticeSample],
  );
  const statusChartOption = React.useMemo(
    () => buildStatusChartOption(noticeStatusSeriesData),
    [noticeStatusSeriesData],
  );
  const statusChartCompactOption = React.useMemo(
    () => buildStatusChartCompactOption(noticeStatusSeriesData),
    [noticeStatusSeriesData],
  );
  const trendChartOption = React.useMemo(
    () => buildTrendChartOption(noticeSample, locale),
    [locale, noticeSample],
  );
  const trendChartCompactOption = React.useMemo(
    () => buildTrendChartCompactOption(noticeSample, locale),
    [locale, noticeSample],
  );

  const widgetTitles = React.useMemo<Record<DashboardWidgetId, string>>(
    () => ({
      'metric-users': t('admin.dashboard.metric.users'),
      'metric-notices': t('admin.dashboard.metric.notices'),
      'metric-role': t('admin.dashboard.metric.role'),
      'panel-action-required': textByLocale(locale, '异常与待处理', 'Alerts'),
      'panel-api-health': textByLocale(locale, '接口质量', 'API Health'),
      'panel-data-quality': textByLocale(locale, '数据质量', 'Data Quality'),
      'chart-status': textByLocale(locale, '公告状态分布', 'Notice Status'),
      'chart-trend': textByLocale(locale, '近7天公告趋势', '7-day Trend'),
      'panel-recent-notices': t('admin.dashboard.recent.title'),
    }),
    [locale, t],
  );

  return {
    widgetTitles,
    statusChartOption,
    statusChartCompactOption,
    trendChartOption,
    trendChartCompactOption,
  };
}
