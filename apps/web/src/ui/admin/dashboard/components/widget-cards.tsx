import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical, Pin, PinOff } from 'lucide-react';
import { Resizable } from 're-resizable';
import type { DashboardLayoutItem, DashboardWidgetId } from '@air-monitor/shared';

import { cn } from '@/lib/utils';
import {
  DASHBOARD_ROW_SPAN_MAX,
  type GridMetrics,
  textByLocale,
} from '@/ui/admin/dashboard/lib/layout';

export type WidgetCardProps = {
  item: DashboardLayoutItem;
  title: string;
  locale: string;
  saving: boolean;
  dragDisabled: boolean;
  dragHandleProps?: Record<string, unknown>;
  onTogglePin: (id: DashboardWidgetId) => void;
  children: React.ReactNode;
};

type ResizableWidgetProps = {
  item: DashboardLayoutItem;
  locale: string;
  maxColSpanForViewport: number;
  gridMetrics: GridMetrics;
  isResizing: boolean;
  onResizeStart: (id: DashboardWidgetId) => void;
  onResizeMove: (id: DashboardWidgetId, width: number, height: number, clientY?: number) => void;
  onResizeStop: (id: DashboardWidgetId, width: number, height: number) => void;
  children: React.ReactNode;
};

export type SortableWidgetCardProps = WidgetCardProps &
  Omit<ResizableWidgetProps, 'children' | 'maxColSpanForViewport' | 'locale'> & {
    spanClassName: string;
    locale: string;
    maxColSpanForViewport: number;
    dropTarget?: boolean;
  };

export function WidgetCard(props: WidgetCardProps): React.ReactNode {
  return (
    <article
      data-tour={`dashboard-widget-${props.item.id}`}
      className={cn(
        'group/widget relative flex h-full min-h-[14rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow,transform,opacity] duration-200 hover:border-blue-200 hover:shadow-md',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-14 before:bg-gradient-to-b before:from-blue-50/45 before:to-transparent before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100',
      )}
    >
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className={cn(
              'inline-flex h-7 w-7 touch-none items-center justify-center rounded-md border border-slate-200 text-slate-400',
              props.dragDisabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-grab hover:bg-slate-50 active:cursor-grabbing',
            )}
            disabled={props.dragDisabled}
            {...props.dragHandleProps}
            aria-label="drag-handle"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <h3 className="truncate text-sm font-semibold text-slate-800">{props.title}</h3>
        </div>
        <button
          type="button"
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
            props.item.pinned
              ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'border-slate-200 text-slate-400 hover:bg-slate-50',
          )}
          onClick={() => props.onTogglePin(props.item.id)}
          disabled={props.saving}
        >
          {props.item.pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-4">{props.children}</div>
    </article>
  );
}

function WidgetResizeHandle(props: { locale: string; active: boolean }): React.ReactNode {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute bottom-2 right-2 z-20 inline-flex h-8 w-8 touch-none items-center justify-center rounded-md border border-slate-200 bg-white/95 text-slate-400 shadow-sm transition-colors leading-none',
        props.active ? 'border-blue-400 text-blue-600' : 'hover:bg-slate-50 hover:text-slate-600',
      )}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label="resize-widget"
      title={textByLocale(props.locale, '拖动调整卡片大小', 'Drag to resize card')}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M4 10L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function ResizableWidgetShell(props: ResizableWidgetProps): React.ReactNode {
  const minWidth = props.gridMetrics.colWidth;
  const maxWidth =
    props.gridMetrics.colWidth * props.maxColSpanForViewport +
    props.gridMetrics.gapX * (props.maxColSpanForViewport - 1);
  const minHeight = props.gridMetrics.rowHeight;
  const maxHeight =
    props.gridMetrics.rowHeight * DASHBOARD_ROW_SPAN_MAX +
    props.gridMetrics.gapY * (DASHBOARD_ROW_SPAN_MAX - 1);

  return (
    <Resizable
      defaultSize={{ width: '100%', height: '100%' }}
      enable={{ right: true, bottom: true, bottomRight: true }}
      handleComponent={{
        right: <div className="pointer-events-auto absolute right-0 top-0 h-full w-2 cursor-ew-resize" />,
        bottom: <div className="pointer-events-auto absolute bottom-0 left-0 h-2 w-full cursor-ns-resize" />,
        bottomRight: <WidgetResizeHandle locale={props.locale} active={props.isResizing} />,
      }}
      minWidth={minWidth}
      maxWidth={maxWidth}
      minHeight={minHeight}
      maxHeight={maxHeight}
      className="relative h-full w-full"
      onResizeStart={(event) => {
        event.stopPropagation();
        props.onResizeStart(props.item.id);
      }}
      onResize={(_event, _direction, element) => {
        const width = element.getBoundingClientRect().width;
        const height = element.getBoundingClientRect().height;
        const maybePointerEvent = _event as MouseEvent | TouchEvent;
        const clientY =
          'clientY' in maybePointerEvent
            ? maybePointerEvent.clientY
            : maybePointerEvent.touches?.[0]?.clientY;
        props.onResizeMove(props.item.id, width, height, clientY);
      }}
      onResizeStop={(_event, _direction, element) => {
        const width = element.getBoundingClientRect().width;
        const height = element.getBoundingClientRect().height;
        props.onResizeStop(props.item.id, width, height);
        element.style.width = '100%';
        element.style.height = '100%';
      }}
    >
      {props.children}
    </Resizable>
  );
}

export function SortableWidgetCard(props: SortableWidgetCardProps): React.ReactNode {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
    disabled: props.dragDisabled,
  });

  const translateOnlyTransform = transform
    ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={{
        // Keep card size stable while dragging/reordering; avoid scale deformation.
        transform: translateOnlyTransform,
        transition: isDragging ? 'none' : transition,
        willChange: 'transform',
      }}
      className={cn(
        props.spanClassName,
        'min-w-0 rounded-xl transition-[box-shadow,border-color,background-color] duration-150',
        isDragging && 'z-20 opacity-25',
        props.dropTarget && 'ring-2 ring-blue-300/85 ring-offset-2 ring-offset-[oklch(0.985_0.005_245)]',
      )}
    >
      <ResizableWidgetShell
        item={props.item}
        locale={props.locale}
        maxColSpanForViewport={props.maxColSpanForViewport}
        gridMetrics={props.gridMetrics}
        isResizing={props.isResizing}
        onResizeStart={props.onResizeStart}
        onResizeMove={props.onResizeMove}
        onResizeStop={props.onResizeStop}
      >
        <WidgetCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
      </ResizableWidgetShell>
    </div>
  );
}
