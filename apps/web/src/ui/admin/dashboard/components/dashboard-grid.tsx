import React from 'react';
import {
  type CollisionDetection,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type {
  DashboardLayoutItem,
  DashboardWidgetId,
  MeResponseData,
  NoticeAdminListData,
  ProviderOverviewData,
} from '@air-monitor/shared';

import { cn } from '@/lib/utils';
import { DashboardWidgetContent } from '@/ui/admin/dashboard/components/dashboard-widget-content';
import {
  ResizableWidgetShell,
  SortableWidgetCard,
  WidgetCard,
  type WidgetCardProps,
} from '@/ui/admin/dashboard/components/widget-cards';
import { type GridMetrics, toWidgetSpanClass } from '@/ui/admin/dashboard/lib/layout';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type DashboardGridProps = {
  layoutLoading: boolean;
  orderedLayout: DashboardLayoutItem[];
  sortableIds: DashboardWidgetId[];
  widgetTitles: Record<DashboardWidgetId, string>;
  locale: string;
  t: TranslateFn;
  loading: boolean;
  me: MeResponseData | null;
  userTotal: number | null;
  noticeTotal: number | null;
  recentNotices: NoticeAdminListData['list'];
  noticeSample: NoticeAdminListData['list'];
  providerOverview: ProviderOverviewData | null;
  statusChartOption: React.ComponentProps<typeof DashboardWidgetContent>['statusChartOption'];
  statusChartCompactOption: React.ComponentProps<typeof DashboardWidgetContent>['statusChartCompactOption'];
  trendChartOption: React.ComponentProps<typeof DashboardWidgetContent>['trendChartOption'];
  trendChartCompactOption: React.ComponentProps<typeof DashboardWidgetContent>['trendChartCompactOption'];
  layoutSaving: boolean;
  maxColSpanForViewport: number;
  gridMetrics: GridMetrics;
  resizingId: DashboardWidgetId | null;
  activeDragId: DashboardWidgetId | null;
  activeDragSize: { width: number; height: number } | null;
  dragOverId: DashboardWidgetId | null;
  sensors: ReturnType<typeof useSensors>;
  collisionDetectionStrategy: CollisionDetection;
  gridRef: React.MutableRefObject<HTMLDivElement | null>;
  scrollViewportRef: React.MutableRefObject<HTMLDivElement | null>;
  onTogglePin: (id: DashboardWidgetId) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  onWidgetResizeStart: (id: DashboardWidgetId) => void;
  onWidgetResizeMove: (id: DashboardWidgetId, width: number, height: number, clientY?: number) => void;
  onWidgetResizeStop: (id: DashboardWidgetId, width: number, height: number) => void;
};

export function DashboardGrid(props: DashboardGridProps): React.ReactNode {
  const activeDragItem = React.useMemo(
    () => (props.activeDragId ? props.orderedLayout.find((item) => item.id === props.activeDragId) ?? null : null),
    [props.activeDragId, props.orderedLayout],
  );
  const isDragging = props.activeDragId !== null;

  const renderWidgetContent = React.useCallback(
    (item: DashboardLayoutItem, loadingOverride?: boolean): React.ReactNode => (
      <DashboardWidgetContent
        item={item}
        loading={loadingOverride ?? props.loading}
        locale={props.locale}
        t={props.t}
        me={props.me}
        userTotal={props.userTotal}
        noticeTotal={props.noticeTotal}
        recentNotices={props.recentNotices}
        noticeSample={props.noticeSample}
        providerOverview={props.providerOverview}
        statusChartOption={props.statusChartOption}
        statusChartCompactOption={props.statusChartCompactOption}
        trendChartOption={props.trendChartOption}
        trendChartCompactOption={props.trendChartCompactOption}
      />
    ),
    [
      props.loading,
      props.locale,
      props.t,
      props.me,
      props.userTotal,
      props.noticeTotal,
      props.recentNotices,
      props.noticeSample,
      props.providerOverview,
      props.statusChartOption,
      props.statusChartCompactOption,
      props.trendChartOption,
      props.trendChartCompactOption,
    ],
  );

  const buildCardProps = React.useCallback(
    (item: DashboardLayoutItem): WidgetCardProps => ({
      item,
      title: props.widgetTitles[item.id],
      locale: props.locale,
      saving: props.layoutSaving,
      dragDisabled: item.pinned || props.resizingId !== null,
      onTogglePin: props.onTogglePin,
      children: renderWidgetContent(item),
    }),
    [props.widgetTitles, props.locale, props.layoutSaving, props.resizingId, props.onTogglePin, renderWidgetContent],
  );

  return (
    <div
      ref={props.scrollViewportRef}
      className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-32 pr-1 pt-4 [scrollbar-gutter:stable] [scroll-padding-bottom:8rem]"
    >
      {props.layoutLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border bg-slate-100/80" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={props.sensors}
          autoScroll={false}
          collisionDetection={props.collisionDetectionStrategy}
          onDragStart={props.onDragStart}
          onDragOver={props.onDragOver}
          onDragEnd={props.onDragEnd}
          onDragCancel={props.onDragCancel}
        >
          <SortableContext items={props.sortableIds} strategy={rectSortingStrategy}>
            <div className="relative">
              <div
                ref={props.gridRef}
                className={cn(
                  'grid min-w-0 auto-rows-[14rem] gap-4 md:grid-cols-2 xl:grid-cols-3',
                  isDragging && 'dashboard-dragging',
                )}
              >
                {props.orderedLayout.map((item) => {
                  const spanClassName = toWidgetSpanClass(item, props.maxColSpanForViewport);
                  const commonProps = buildCardProps(item);
                  const isDropTarget =
                    isDragging && props.dragOverId === item.id && props.activeDragId !== item.id;
                  const dropTargetClassName =
                    'ring-2 ring-blue-300/85 ring-offset-2 ring-offset-[oklch(0.985_0.005_245)] bg-blue-50/35';

                  if (item.pinned) {
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          spanClassName,
                          'rounded-xl transition-[box-shadow,border-color,background-color] duration-150',
                          isDropTarget && dropTargetClassName,
                        )}
                      >
                        <ResizableWidgetShell
                          item={item}
                          locale={props.locale}
                          maxColSpanForViewport={props.maxColSpanForViewport}
                          gridMetrics={props.gridMetrics}
                          isResizing={props.resizingId === item.id}
                          onResizeStart={props.onWidgetResizeStart}
                          onResizeMove={props.onWidgetResizeMove}
                          onResizeStop={props.onWidgetResizeStop}
                        >
                          <WidgetCard {...commonProps} />
                        </ResizableWidgetShell>
                      </div>
                    );
                  }

                  return (
                    <SortableWidgetCard
                      key={item.id}
                      {...commonProps}
                      maxColSpanForViewport={props.maxColSpanForViewport}
                      spanClassName={spanClassName}
                      gridMetrics={props.gridMetrics}
                      isResizing={props.resizingId === item.id}
                      dropTarget={isDropTarget}
                      onResizeStart={props.onWidgetResizeStart}
                      onResizeMove={props.onWidgetResizeMove}
                      onResizeStop={props.onWidgetResizeStop}
                    />
                  );
                })}
              </div>
              <div className="h-8 w-full" aria-hidden />
            </div>
          </SortableContext>

          <DragOverlay
            dropAnimation={{
              duration: 150,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            {activeDragItem ? (
              <div
                style={props.activeDragSize ?? undefined}
                className="pointer-events-none relative min-h-[14rem] w-full rounded-xl"
              >
                <WidgetCard
                  item={activeDragItem}
                  title={props.widgetTitles[activeDragItem.id]}
                  locale={props.locale}
                  saving={false}
                  dragDisabled
                  onTogglePin={() => undefined}
                >
                  {renderWidgetContent(
                    activeDragItem,
                    activeDragItem.id === 'chart-status' || activeDragItem.id === 'chart-trend',
                  )}
                </WidgetCard>
                <span className="absolute right-3 top-3 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                  {props.locale.startsWith('zh') ? '拖拽中' : 'Dragging'}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
