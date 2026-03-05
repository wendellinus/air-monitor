export const DashboardWidgetIds = [
  'metric-users',
  'metric-notices',
  'metric-role',
  'panel-action-required',
  'panel-api-health',
  'panel-data-quality',
  'chart-status',
  'chart-trend',
  'panel-recent-notices',
] as const;

export type DashboardWidgetId = (typeof DashboardWidgetIds)[number];

export type DashboardLayoutItem = {
  id: DashboardWidgetId;
  order: number;
  pinned: boolean;
  colSpan: number;
  rowSpan: number;
};

export type DashboardLayoutData = {
  version: number;
  layout: DashboardLayoutItem[];
  updatedAt: string | null;
};

export type UpdateDashboardLayoutRequest = {
  layout: DashboardLayoutItem[];
};
