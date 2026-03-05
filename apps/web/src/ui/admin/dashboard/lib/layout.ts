import { arrayMove } from '@dnd-kit/sortable';
import type { DashboardLayoutItem, DashboardWidgetId } from '@air-monitor/shared';

import { cn } from '@/lib/utils';

export type GridMetrics = {
  colCount: number;
  colWidth: number;
  rowHeight: number;
  gapX: number;
  gapY: number;
  stepX: number;
  stepY: number;
};

const ROW_SPAN_CLASSES: Record<1 | 2 | 3, string> = {
  1: 'row-span-1',
  2: 'row-span-2',
  3: 'row-span-3',
};

const COL_SPAN_CLASSES: Record<1 | 2 | 3, string> = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2 xl:col-span-2',
  3: 'col-span-1 md:col-span-2 xl:col-span-3',
};

export const DASHBOARD_COL_SPAN_MAX = 3;
export const DASHBOARD_ROW_SPAN_MAX = 3;
const GRID_GAP_PX = 16;
const GRID_ROW_HEIGHT_PX = 224;

export const DASHBOARD_WIDGET_IDS: DashboardWidgetId[] = [
  'metric-users',
  'metric-notices',
  'metric-role',
  'panel-action-required',
  'panel-api-health',
  'panel-data-quality',
  'chart-status',
  'chart-trend',
  'panel-recent-notices',
];

const WIDGET_ID_SET = new Set<string>(DASHBOARD_WIDGET_IDS);

const DEFAULT_SIZE: Record<DashboardWidgetId, { colSpan: number; rowSpan: number }> = {
  'metric-users': { colSpan: 1, rowSpan: 1 },
  'metric-notices': { colSpan: 1, rowSpan: 1 },
  'metric-role': { colSpan: 1, rowSpan: 1 },
  'panel-action-required': { colSpan: 1, rowSpan: 1 },
  'panel-api-health': { colSpan: 1, rowSpan: 1 },
  'panel-data-quality': { colSpan: 1, rowSpan: 1 },
  'chart-status': { colSpan: 2, rowSpan: 2 },
  'chart-trend': { colSpan: 2, rowSpan: 2 },
  'panel-recent-notices': { colSpan: 2, rowSpan: 2 },
};

const MIN_COL_SPAN: Partial<Record<DashboardWidgetId, number>> = {
  // keep empty: all widgets are user-resizable from 1..max columns
};

const MIN_ROW_SPAN: Partial<Record<DashboardWidgetId, number>> = {
  // keep empty: all widgets are user-resizable from 1..3 rows
};

export function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function readGridMetrics(grid: HTMLDivElement | null, viewportCols: number): GridMetrics {
  if (!grid) {
    const fallbackCols = Math.max(1, viewportCols);
    const fallbackWidth = 360;
    return {
      colCount: fallbackCols,
      colWidth: fallbackWidth,
      rowHeight: GRID_ROW_HEIGHT_PX,
      gapX: GRID_GAP_PX,
      gapY: GRID_GAP_PX,
      stepX: fallbackWidth + GRID_GAP_PX,
      stepY: GRID_ROW_HEIGHT_PX + GRID_GAP_PX,
    };
  }

  const styles = window.getComputedStyle(grid);
  const gapX = Number.parseFloat(styles.columnGap) || GRID_GAP_PX;
  const gapY = Number.parseFloat(styles.rowGap) || gapX;
  const rowHeight = Number.parseFloat(styles.gridAutoRows) || GRID_ROW_HEIGHT_PX;
  const colCount = Math.max(1, viewportCols);
  const totalGapX = gapX * (colCount - 1);
  const colWidth = Math.max(96, (grid.clientWidth - totalGapX) / colCount);

  return {
    colCount,
    colWidth,
    rowHeight,
    gapX,
    gapY,
    stepX: colWidth + gapX,
    stepY: rowHeight + gapY,
  };
}

export function spanFromWidth(width: number, metrics: GridMetrics, maxCol: number): number {
  // Map physical width to nearest grid span. This guarantees max width can reach max span.
  const step = metrics.colWidth + metrics.gapX;
  const value = Math.round((width + metrics.gapX) / step);
  return clamp(value, 1, maxCol);
}

export function spanFromHeight(height: number, metrics: GridMetrics): number {
  // Mirror width behavior for vertical resizing.
  const step = metrics.rowHeight + metrics.gapY;
  const value = Math.round((height + metrics.gapY) / step);
  return clamp(value, 1, DASHBOARD_ROW_SPAN_MAX);
}

export function getViewportColumns(width: number): number {
  if (width >= 1280) return 3;
  if (width >= 768) return 2;
  return 1;
}

export function getMaxColSpanForWidth(width: number): number {
  return Math.min(DASHBOARD_COL_SPAN_MAX, getViewportColumns(width));
}

export function getWidgetMinColSpan(id: DashboardWidgetId, maxColSpan: number): number {
  const min = MIN_COL_SPAN[id] ?? 1;
  return clamp(min, 1, Math.max(1, maxColSpan));
}

export function getWidgetMinRowSpan(id: DashboardWidgetId): number {
  return clamp(MIN_ROW_SPAN[id] ?? 1, 1, DASHBOARD_ROW_SPAN_MAX);
}

export function isWidgetId(input: string): input is DashboardWidgetId {
  return WIDGET_ID_SET.has(input);
}

export function withSequentialOrder(layout: DashboardLayoutItem[]): DashboardLayoutItem[] {
  return layout.map((item, index) => ({ ...item, order: index }));
}

export function buildDefaultLayout(): DashboardLayoutItem[] {
  return DASHBOARD_WIDGET_IDS.map((id, index) => ({
    id,
    order: index,
    pinned: false,
    colSpan: DEFAULT_SIZE[id].colSpan,
    rowSpan: DEFAULT_SIZE[id].rowSpan,
  }));
}

export function normalizeLayout(layout: DashboardLayoutItem[]): DashboardLayoutItem[] {
  const seen = new Set<string>();
  const normalized: DashboardLayoutItem[] = [];
  const sorted = [...layout].sort((a, b) => a.order - b.order);

  for (const item of sorted) {
    const id = String(item.id);
    if (!isWidgetId(id) || seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      order: normalized.length,
      pinned: Boolean(item.pinned),
      colSpan: clamp(
        Number.isFinite(item.colSpan) ? Math.trunc(item.colSpan) : DEFAULT_SIZE[id].colSpan,
        getWidgetMinColSpan(id, DASHBOARD_COL_SPAN_MAX),
        DASHBOARD_COL_SPAN_MAX,
      ),
      rowSpan: clamp(
        Number.isFinite(item.rowSpan) ? Math.trunc(item.rowSpan) : DEFAULT_SIZE[id].rowSpan,
        getWidgetMinRowSpan(id),
        DASHBOARD_ROW_SPAN_MAX,
      ),
    });
  }

  for (const id of DASHBOARD_WIDGET_IDS) {
    if (seen.has(id)) continue;
    normalized.push({
      id,
      order: normalized.length,
      pinned: false,
      colSpan: DEFAULT_SIZE[id].colSpan,
      rowSpan: DEFAULT_SIZE[id].rowSpan,
    });
  }

  return normalized;
}

export function reorderWithinUnlockedSlots(
  layout: DashboardLayoutItem[],
  activeId: DashboardWidgetId,
  overId: DashboardWidgetId,
): DashboardLayoutItem[] {
  const ordered = [...layout].sort((a, b) => a.order - b.order);
  const mapById = new Map(ordered.map((item) => [item.id, item]));
  if (mapById.get(activeId)?.pinned || mapById.get(overId)?.pinned) return ordered;

  const unlockedIndexes = ordered
    .map((item, index) => ({ item, index }))
    .filter((entry) => !entry.item.pinned)
    .map((entry) => entry.index);
  const unlockedIds = unlockedIndexes.map((index) => ordered[index].id);
  const from = unlockedIds.indexOf(activeId);
  const toRaw = unlockedIds.indexOf(overId);
  if (from < 0 || toRaw < 0) return ordered;

  if (from === toRaw) return ordered;

  const moved = arrayMove(unlockedIds, from, toRaw);
  const next = [...ordered];
  unlockedIndexes.forEach((slotIndex, position) => {
    const source = mapById.get(moved[position]);
    if (!source) return;
    next[slotIndex] = { ...source, order: slotIndex, pinned: false };
  });
  return withSequentialOrder(next);
}

export function toWidgetSpanClass(item: DashboardLayoutItem, maxColSpanForViewport: number): string {
  const colSpan = clamp(
    item.colSpan,
    getWidgetMinColSpan(item.id, maxColSpanForViewport),
    maxColSpanForViewport,
  ) as 1 | 2 | 3;
  const rowSpan = clamp(item.rowSpan, getWidgetMinRowSpan(item.id), DASHBOARD_ROW_SPAN_MAX) as 1 | 2 | 3;
  return cn(COL_SPAN_CLASSES[colSpan], ROW_SPAN_CLASSES[rowSpan]);
}
