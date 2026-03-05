import React from 'react';
import type { DashboardWidgetId } from '@air-monitor/shared';

import { RefreshIconButton } from '@/ui/admin/components/feedback';
import { textByLocale } from '@/ui/admin/dashboard/lib/layout';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type DashboardHeaderProps = {
  t: TranslateFn;
  locale: string;
  username: string;
  isRefreshing: boolean;
  refreshLocked: boolean;
  layoutLoading: boolean;
  resizingId: DashboardWidgetId | null;
  onRefresh: () => void;
};

export function DashboardHeader(props: DashboardHeaderProps): React.ReactNode {
  return (
    <div className="shrink-0 border-b border-slate-200/80 bg-[oklch(0.985_0.005_245)] pb-4 pt-1">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{props.t('admin.dashboard.title')}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {props.t('admin.dashboard.welcome', { username: props.username })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshIconButton
            size="sm"
            onClick={props.onRefresh}
            loading={props.isRefreshing}
            disabled={
              props.layoutLoading ||
              props.isRefreshing ||
              props.refreshLocked ||
              props.resizingId !== null
            }
            label={props.t('admin.common.refresh')}
          />
          <p className="hidden text-xs text-slate-400 xl:block">
            {textByLocale(
              props.locale,
              '拖拽可调整顺序，右下角可调整卡片大小。',
              'Drag to reorder, resize from bottom-right handle.',
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
