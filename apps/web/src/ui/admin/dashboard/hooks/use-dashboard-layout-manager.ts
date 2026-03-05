import React from 'react';
import {
  type CollisionDetection,
  PointerSensor,
  closestCorners,
  pointerWithin,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import type { DashboardLayoutData, DashboardLayoutItem, DashboardWidgetId } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  DASHBOARD_COL_SPAN_MAX,
  DASHBOARD_ROW_SPAN_MAX,
  buildDefaultLayout,
  clamp,
  getMaxColSpanForWidth,
  getViewportColumns,
  getWidgetMinColSpan,
  getWidgetMinRowSpan,
  isWidgetId,
  normalizeLayout,
  readGridMetrics,
  reorderWithinUnlockedSlots,
  spanFromHeight,
  spanFromWidth,
  textByLocale,
  withSequentialOrder,
  type GridMetrics,
} from '@/ui/admin/dashboard/lib/layout';

type ResizeSession = {
  id: DashboardWidgetId;
  changed: boolean;
};

type DashboardLayoutManager = {
  layoutLoading: boolean;
  layoutSaving: boolean;
  orderedLayout: DashboardLayoutItem[];
  sortableIds: DashboardWidgetId[];
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

export function useDashboardLayoutManager(locale: string): DashboardLayoutManager {
  const [layout, setLayout] = React.useState<DashboardLayoutItem[]>(buildDefaultLayout());
  const [layoutLoading, setLayoutLoading] = React.useState(true);
  const [layoutSaving, setLayoutSaving] = React.useState(false);
  const [overId, setOverId] = React.useState<DashboardWidgetId | null>(null);
  const [resizingId, setResizingId] = React.useState<DashboardWidgetId | null>(null);
  const [activeDragId, setActiveDragId] = React.useState<DashboardWidgetId | null>(null);
  const [activeDragSize, setActiveDragSize] = React.useState<{ width: number; height: number } | null>(null);
  const [viewportCols, setViewportCols] = React.useState<number>(() =>
    typeof window === 'undefined' ? 3 : getViewportColumns(window.innerWidth),
  );
  const [gridMetrics, setGridMetrics] = React.useState<GridMetrics>(() => readGridMetrics(null, 3));

  const saveRequestIdRef = React.useRef(0);
  const latestLayoutRef = React.useRef<DashboardLayoutItem[]>(layout);
  const resizeSessionRef = React.useRef<ResizeSession | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const scrollViewportRef = React.useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1 } }));

  const collisionDetectionStrategy = React.useCallback<CollisionDetection>((args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;
    return closestCorners(args);
  }, []);

  React.useEffect(() => {
    latestLayoutRef.current = layout;
  }, [layout]);

  React.useEffect(() => {
    const onResize = () => setViewportCols(getViewportColumns(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  React.useEffect(() => {
    if (resizingId === null) return;
    const releaseResizeLock = (): void => {
      resizeSessionRef.current = null;
      setResizingId(null);
    };
    window.addEventListener('pointerup', releaseResizeLock, true);
    window.addEventListener('pointercancel', releaseResizeLock, true);
    window.addEventListener('blur', releaseResizeLock);
    return () => {
      window.removeEventListener('pointerup', releaseResizeLock, true);
      window.removeEventListener('pointercancel', releaseResizeLock, true);
      window.removeEventListener('blur', releaseResizeLock);
    };
  }, [resizingId]);

  React.useEffect(() => {
    const updateMetrics = () => {
      setGridMetrics(readGridMetrics(gridRef.current, viewportCols));
    };
    updateMetrics();
    const observer =
      typeof ResizeObserver !== 'undefined' && gridRef.current
        ? new ResizeObserver(() => updateMetrics())
        : null;
    if (gridRef.current) observer?.observe(gridRef.current);

    window.addEventListener('resize', updateMetrics);
    return () => {
      window.removeEventListener('resize', updateMetrics);
      observer?.disconnect();
    };
  }, [viewportCols, layoutLoading]);

    const persistLayout = React.useCallback(
    (nextLayout: DashboardLayoutItem[]): void => {
      const requestId = ++saveRequestIdRef.current;
      setLayoutSaving(true);

      const runPersist = async (): Promise<void> => {
        try {
          await api.put<ApiResponse<DashboardLayoutData>>('/user/me/dashboard-layout', {
            layout: nextLayout.map((item, index) => ({
              ...item,
              order: index,
              colSpan: clamp(
                item.colSpan,
                getWidgetMinColSpan(item.id, DASHBOARD_COL_SPAN_MAX),
                DASHBOARD_COL_SPAN_MAX,
              ),
              rowSpan: clamp(item.rowSpan, getWidgetMinRowSpan(item.id), DASHBOARD_ROW_SPAN_MAX),
            })),
          });
        } catch (error: unknown) {
          toast.error(
            error instanceof Error
              ? error.message
              : textByLocale(locale, '布局保存失败', 'Failed to save layout'),
          );
        } finally {
          if (requestId !== saveRequestIdRef.current) return;
          setLayoutSaving(false);
        }
      };

      void runPersist();
    },
    [locale],
  );

  React.useEffect(() => {
    let mounted = true;

    async function loadLayout(): Promise<void> {
      setLayoutLoading(true);
      try {
        const layoutRes = await api.get<ApiResponse<DashboardLayoutData>>('/user/me/dashboard-layout');
        if (!mounted) return;
        setLayout(normalizeLayout(layoutRes.data.data.layout));
      } catch {
        if (!mounted) return;
        setLayout(buildDefaultLayout());
      } finally {
        if (!mounted) return;
        setLayoutLoading(false);
      }
    }

    void loadLayout();
    return () => {
      mounted = false;
    };
  }, []);

  const orderedLayout = React.useMemo(() => [...layout].sort((a, b) => a.order - b.order), [layout]);
  const orderedById = React.useMemo(
    () => new Map(orderedLayout.map((item) => [item.id, item])),
    [orderedLayout],
  );
  const sortableIds = React.useMemo(
    () => orderedLayout.filter((item) => !item.pinned).map((item) => item.id),
    [orderedLayout],
  );
  const maxColSpanForViewport = React.useMemo(
    () => Math.min(DASHBOARD_COL_SPAN_MAX, viewportCols),
    [viewportCols],
  );

  const onTogglePin = React.useCallback(
    (id: DashboardWidgetId) => {
      setLayout((prev) => {
        const next = withSequentialOrder(
          prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)),
        );
        persistLayout(next);
        return next;
      });
    },
    [persistLayout],
  );

  const onDragStart = React.useCallback(
    (event: DragStartEvent) => {
      if (resizingId) return;
      const id = String(event.active.id);
      if (!isWidgetId(id) || orderedById.get(id)?.pinned) return;
      setOverId(id);
      setActiveDragId(id);
      const rect = event.active.rect.current.initial ?? event.active.rect.current.translated;
      if (rect) {
        setActiveDragSize({ width: rect.width, height: rect.height });
      } else {
        setActiveDragSize(null);
      }
    },
    [orderedById, resizingId],
  );

  const onDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const id = event.over ? String(event.over.id) : null;
      if (!id || !isWidgetId(id) || orderedById.get(id)?.pinned) return;
      setOverId(id);
    },
    [orderedById],
  );

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const from = String(event.active.id);
      const to = overId ?? (event.over ? String(event.over.id) : null);
      setOverId(null);
      setActiveDragId(null);
      setActiveDragSize(null);
      if (!to || from === to || !isWidgetId(from) || !isWidgetId(to)) return;

      setLayout((prev) => {
        const next = reorderWithinUnlockedSlots(prev, from, to);
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          persistLayout(next);
        }
        return next;
      });
    },
    [overId, persistLayout],
  );

  const onDragCancel = React.useCallback(() => {
    setOverId(null);
    setActiveDragId(null);
    setActiveDragSize(null);
  }, []);

  const updateWidgetSpan = React.useCallback(
    (id: DashboardWidgetId, width: number, height: number, commit: boolean): void => {
      const maxCol = Math.min(maxColSpanForViewport, getMaxColSpanForWidth(window.innerWidth));
      const nextCol = spanFromWidth(width, gridMetrics, maxCol);
      const nextRow = spanFromHeight(height, gridMetrics);
      const current = latestLayoutRef.current.find((item) => item.id === id);
      if (!current) return;
      if (current.colSpan === nextCol && current.rowSpan === nextRow) return;

      setLayout((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          return { ...item, colSpan: nextCol, rowSpan: nextRow };
        });
        const normalized = withSequentialOrder(next);
        latestLayoutRef.current = normalized;
        if (commit) {
          persistLayout(normalized);
        }
        return normalized;
      });
    },
    [gridMetrics, maxColSpanForViewport, persistLayout],
  );

  const onWidgetResizeStart = React.useCallback((id: DashboardWidgetId): void => {
    resizeSessionRef.current = { id, changed: false };
    setResizingId(id);
  }, []);

  const onWidgetResizeMove = React.useCallback(
    (id: DashboardWidgetId, width: number, height: number, clientY?: number): void => {
      const maxCol = Math.min(maxColSpanForViewport, getMaxColSpanForWidth(window.innerWidth));
      const nextCol = spanFromWidth(width, gridMetrics, maxCol);
      const nextRow = spanFromHeight(height, gridMetrics);
      const current = latestLayoutRef.current.find((item) => item.id === id);
      const changed = Boolean(current && (current.colSpan !== nextCol || current.rowSpan !== nextRow));

      const viewport = scrollViewportRef.current;
      if (viewport && typeof clientY === 'number') {
        const rect = viewport.getBoundingClientRect();
        const edgeThreshold = 92;
        if (clientY > rect.bottom - edgeThreshold) {
          const ratio = (clientY - (rect.bottom - edgeThreshold)) / edgeThreshold;
          viewport.scrollTop += Math.ceil(4 + ratio * 14);
        } else if (clientY < rect.top + edgeThreshold) {
          const ratio = (rect.top + edgeThreshold - clientY) / edgeThreshold;
          viewport.scrollTop -= Math.ceil(4 + ratio * 14);
        }
      }

      if (!changed) return;

      updateWidgetSpan(id, width, height, false);
      if (resizeSessionRef.current?.id === id) {
        resizeSessionRef.current.changed = true;
      }
    },
    [gridMetrics, maxColSpanForViewport, updateWidgetSpan],
  );

  const onWidgetResizeStop = React.useCallback(
    (id: DashboardWidgetId, width: number, height: number): void => {
      const changed = Boolean(resizeSessionRef.current?.changed);
      if (changed) {
        updateWidgetSpan(id, width, height, true);
      }
      resizeSessionRef.current = null;
      setResizingId(null);
    },
    [updateWidgetSpan],
  );

  return {
    layoutLoading,
    layoutSaving,
    orderedLayout,
    sortableIds,
    maxColSpanForViewport,
    gridMetrics,
    resizingId,
    activeDragId,
    activeDragSize,
    dragOverId: overId,
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
  };
}

