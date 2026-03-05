import React from 'react';
import { AlertTriangle, Bell, Shield, Users } from 'lucide-react';
import type { EChartsOption } from 'echarts';
import { Link } from 'react-router-dom';
import type {
  DashboardLayoutItem,
  MeResponseData,
  NoticeAdminListData,
  ProviderOverviewData,
} from '@air-monitor/shared';

import { cn } from '@/lib/utils';
import {
  DASHBOARD_ROW_SPAN_MAX,
  clamp,
  getWidgetMinRowSpan,
  textByLocale,
} from '@/ui/admin/dashboard/lib/layout';
import { noticeStatusLabel } from '@/ui/admin/dashboard/lib/charts';
import {
  EChartsViewport,
  EmptyPanel,
  Metric,
  MetricSkeleton,
  QuickStats,
  SkeletonChart,
  SkeletonList,
  getChartHeightClass,
} from '@/ui/admin/dashboard/components/dashboard-primitives';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type DashboardWidgetContentProps = {
  item: DashboardLayoutItem;
  loading: boolean;
  locale: string;
  t: TranslateFn;
  me: MeResponseData | null;
  userTotal: number | null;
  noticeTotal: number | null;
  recentNotices: NoticeAdminListData['list'];
  noticeSample: NoticeAdminListData['list'];
  providerOverview: ProviderOverviewData | null;
  statusChartOption: EChartsOption;
  statusChartCompactOption: EChartsOption;
  trendChartOption: EChartsOption;
  trendChartCompactOption: EChartsOption;
};

export function DashboardWidgetContent(props: DashboardWidgetContentProps): React.ReactNode {
  const {
    item,
    loading,
    locale,
    t,
    me,
    userTotal,
    noticeTotal,
    recentNotices,
    noticeSample,
    providerOverview,
    statusChartOption,
    statusChartCompactOption,
    trendChartOption,
    trendChartCompactOption,
  } = props;

  const rowSpan = clamp(item.rowSpan, getWidgetMinRowSpan(item.id), DASHBOARD_ROW_SPAN_MAX);

  if (item.id === 'metric-users') {
    if (loading) return <MetricSkeleton />;
    return (
      <Metric
        icon={Users}
        iconClassName="from-blue-500 to-blue-600"
        label={t('admin.dashboard.metric.users')}
        value={String(userTotal ?? 0)}
        hint={t('admin.dashboard.metric.usersHint')}
      />
    );
  }

  if (item.id === 'metric-notices') {
    if (loading) return <MetricSkeleton />;
    return (
      <Metric
        icon={Bell}
        iconClassName="from-amber-500 to-orange-500"
        label={t('admin.dashboard.metric.notices')}
        value={String(noticeTotal ?? 0)}
        hint={t('admin.dashboard.metric.noticesHint')}
      />
    );
  }

  if (item.id === 'metric-role') {
    if (loading) return <MetricSkeleton />;
    return (
      <Metric
        icon={Shield}
        iconClassName="from-violet-500 to-purple-600"
        label={t('admin.dashboard.metric.role')}
        value={me?.role ? t(`admin.users.role.${me.role}`) : '-'}
        hint={me?.username ?? '-'}
      />
    );
  }

  if (item.id === 'chart-status') {
    const option = rowSpan === 1 ? statusChartCompactOption : statusChartOption;
    return loading ? (
      <SkeletonChart rowSpan={rowSpan} />
    ) : (
      <EChartsViewport
        option={option}
        className={cn('w-full', rowSpan === 1 ? 'pb-1' : 'pb-4', getChartHeightClass(rowSpan))}
      />
    );
  }

  if (item.id === 'chart-trend') {
    const option = rowSpan === 1 ? trendChartCompactOption : trendChartOption;
    return loading ? (
      <SkeletonChart rowSpan={rowSpan} />
    ) : (
      <EChartsViewport
        option={option}
        className={cn('w-full', rowSpan === 1 ? 'pb-1' : 'pb-4', getChartHeightClass(rowSpan))}
      />
    );
  }

  if (item.id === 'panel-recent-notices') {
    if (loading) return <SkeletonList />;
    if (recentNotices.length === 0) return <EmptyPanel label={t('admin.dashboard.recent.empty')} />;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
        {recentNotices.map((notice) => (
          <div key={notice.id} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2.5 text-sm">
            <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
              {t(`admin.notices.level.${notice.level}`)}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{notice.title}</span>
            <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {noticeStatusLabel(notice.status, locale)}
            </span>
          </div>
        ))}
        <Link
          to="/admin/notices"
          className="inline-flex items-center gap-1 pt-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {t('admin.dashboard.recent.viewAll')}
        </Link>
      </div>
    );
  }

  if (item.id === 'panel-action-required') {
    const pending = noticeSample.filter((entry) => entry.status === 'pending').length;
    return (
      <QuickStats
        rows={[
          { label: textByLocale(locale, '待生效公告', 'Pending'), value: pending },
          {
            label: textByLocale(locale, '平台异常', 'Degraded'),
            value: (providerOverview?.providers ?? []).filter((provider) => provider.status !== 'ok').length,
          },
        ]}
      />
    );
  }

  if (item.id === 'panel-api-health') {
    const total = providerOverview?.providers.length ?? 0;
    const ok = (providerOverview?.providers ?? []).filter((provider) => provider.status === 'ok').length;
    const rate = total > 0 ? `${Math.round((ok / total) * 100)}%` : '-';
    return (
      <QuickStats
        rows={[
          { label: textByLocale(locale, '平台健康率', 'Health'), value: rate },
          {
            label: textByLocale(locale, '总请求量', 'Requests'),
            value: (providerOverview?.totals.requestCount ?? 0).toLocaleString(),
          },
        ]}
      />
    );
  }

  if (item.id === 'panel-data-quality') {
    const missing = noticeSample.filter((entry) => !(entry.content ?? '').trim()).length;
    return (
      <QuickStats
        rows={[
          { label: textByLocale(locale, '内容缺失', 'Missing Content'), value: missing },
          { label: textByLocale(locale, '公告总数', 'Total Notices'), value: noticeSample.length },
        ]}
      />
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      {textByLocale(locale, '未知组件', 'Unknown widget')}
    </div>
  );
}
