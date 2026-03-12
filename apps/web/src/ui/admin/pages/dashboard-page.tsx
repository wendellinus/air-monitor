import React from 'react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { useI18n } from '@/shared/i18n';
import { PageContentSpin } from '@/ui/admin/components/page-content-spin';
import { DashboardGrid } from '@/ui/admin/dashboard/components/dashboard-grid';
import { DashboardHeader } from '@/ui/admin/dashboard/components/dashboard-header';
import { DashboardSpotlight } from '@/ui/admin/dashboard/components/dashboard-spotlight';
import { useDashboardCoreData } from '@/ui/admin/dashboard/hooks/use-dashboard-core-data';
import { useDashboardLayoutManager } from '@/ui/admin/dashboard/hooks/use-dashboard-layout-manager';
import { useDashboardWidgetConfig } from '@/ui/admin/dashboard/hooks/use-dashboard-widget-config';

export function AdminDashboard(): React.ReactNode {
  const { t, locale } = useI18n();
  const {
    me,
    userTotal,
    noticeTotal,
    recentNotices,
    noticeSample,
    providerOverview,
    spotlight,
    loading,
    isRefreshing,
    refresh,
  } = useDashboardCoreData(locale);

  const {
    layoutLoading,
    layoutSaving,
    orderedLayout,
    sortableIds,
    maxColSpanForViewport,
    gridMetrics,
    resizingId,
    activeDragId,
    activeDragSize,
    dragOverId,
    sensors,
    collisionDetectionStrategy,
    gridRef,
    scrollViewportRef,
    onTogglePin,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDragCancel,
    onWidgetResizeStart,
    onWidgetResizeMove,
    onWidgetResizeStop,
  } = useDashboardLayoutManager(locale);

  const {
    widgetTitles,
    statusChartOption,
    statusChartCompactOption,
    trendChartOption,
    trendChartCompactOption,
  } = useDashboardWidgetConfig({
    t,
    locale,
    noticeSample,
  });

  const handleRefresh = React.useCallback(async (): Promise<void> => {
    if (layoutLoading) return;
    await refresh();
  }, [layoutLoading, refresh]);
  const refreshAction = useRateLimitedAction(() => handleRefresh(), { cooldownMs: 800 });

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <DashboardHeader
        t={t}
        locale={locale}
        username={me?.username ?? '-'}
        isRefreshing={isRefreshing}
        refreshLocked={refreshAction.locked}
        layoutLoading={layoutLoading}
        resizingId={resizingId}
        onRefresh={refreshAction.run}
      />

      <div
        ref={scrollViewportRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-10 pr-2 pt-4 [scroll-padding-bottom:2rem]"
      >
        <DashboardSpotlight
          locale={locale}
          averageAqi={spotlight.averageAqi}
          alertCityCount={spotlight.alertCityCount}
          cleanestCities={spotlight.cleanestCities}
          riskiestCities={spotlight.riskiestCities}
          noticeSample={noticeSample}
          providerOverview={providerOverview}
        />

        <PageContentSpin spinning={layoutLoading} className="min-h-0 pt-4">
          <DashboardGrid
            layoutLoading={layoutLoading}
            orderedLayout={orderedLayout}
            sortableIds={sortableIds}
            widgetTitles={widgetTitles}
            locale={locale}
            t={t}
            loading={loading}
            me={me}
            userTotal={userTotal}
            noticeTotal={noticeTotal}
            recentNotices={recentNotices}
            noticeSample={noticeSample}
            providerOverview={providerOverview}
            statusChartOption={statusChartOption}
            statusChartCompactOption={statusChartCompactOption}
            trendChartOption={trendChartOption}
            trendChartCompactOption={trendChartCompactOption}
            layoutSaving={layoutSaving}
            maxColSpanForViewport={maxColSpanForViewport}
            gridMetrics={gridMetrics}
            resizingId={resizingId}
            activeDragId={activeDragId}
            activeDragSize={activeDragSize}
            dragOverId={dragOverId}
            sensors={sensors}
            collisionDetectionStrategy={collisionDetectionStrategy}
            gridRef={gridRef}
            scrollViewportRef={scrollViewportRef}
            onTogglePin={onTogglePin}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
            onWidgetResizeStart={onWidgetResizeStart}
            onWidgetResizeMove={onWidgetResizeMove}
            onWidgetResizeStop={onWidgetResizeStop}
          />
        </PageContentSpin>
      </div>
    </section>
  );
}
