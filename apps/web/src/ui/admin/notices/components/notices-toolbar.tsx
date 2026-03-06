import React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { TranslateFn } from '@/ui/admin/notices/lib/types';

type NoticesToolbarProps = {
  t: TranslateFn;
  effectiveFrom: string;
  effectiveTo: string;
  hasActiveFilters: boolean;
  isRefreshing: boolean;
  isInitialLoading: boolean;
  refreshLocked: boolean;
  onEffectiveFromChange: (value: string) => void;
  onEffectiveToChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export function NoticesToolbar(props: NoticesToolbarProps): React.ReactNode {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto]">
        <DateTimePicker
          className="h-10"
          value={props.effectiveFrom}
          onChange={props.onEffectiveFromChange}
          placeholder={props.t('admin.notices.filters.effectiveFrom')}
        />
        <DateTimePicker
          className="h-10"
          value={props.effectiveTo}
          onChange={props.onEffectiveToChange}
          placeholder={props.t('admin.notices.filters.effectiveTo')}
        />
        <Button
          variant="outline"
          className="h-10 px-4"
          onClick={props.onClearFilters}
          disabled={!props.hasActiveFilters}
        >
          {props.t('admin.notices.filters.reset')}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <RefreshIconButton
          label={props.t('admin.common.refresh')}
          onClick={props.onRefresh}
          loading={props.isRefreshing || props.refreshLocked}
          disabled={props.isRefreshing || props.isInitialLoading || props.refreshLocked}
          className="h-10"
        />
        <Button onClick={props.onCreate} className="h-10 px-4">
          <Plus className="mr-2 h-4 w-4" />
          {props.t('admin.notices.new')}
        </Button>
      </div>
    </div>
  );
}
