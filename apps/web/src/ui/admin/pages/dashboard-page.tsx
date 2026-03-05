import React from 'react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { useI18n } from '@/shared/i18n';
import { AdminDriverTourButton } from '@/ui/admin/components/admin-driver-tour-button';
import { PageContentSpin } from '@/ui/admin/components/page-content-spin';
import { DashboardGrid } from '@/ui/admin/dashboard/components/dashboard-grid';
import { DashboardHeader } from '@/ui/admin/dashboard/components/dashboard-header';
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

  React.useEffect(() => {
    const viewport = document.querySelector<HTMLElement>('[data-admin-outlet-viewport]');
    if (!viewport) return;
    const previousOverflow = viewport.style.overflow;
    viewport.style.overflow = 'hidden';
    return () => {
      viewport.style.overflow = previousOverflow;
    };
  }, []);

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

      <AdminDriverTourButton locale={locale} role={me?.role} hideTrigger />

      <PageContentSpin spinning={layoutLoading} className="min-h-0 flex-1">
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
    </section>
  );
}
