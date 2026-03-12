import React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { NoticeFilterStatus, TranslateFn } from '@/ui/admin/notices/lib/types';

type NoticesToolbarProps = {
  t: TranslateFn;
  statusFilter: NoticeFilterStatus;
  effectiveFrom: string;
  effectiveTo: string;
  hasActiveFilters: boolean;
  isRefreshing: boolean;
  isInitialLoading: boolean;
  refreshLocked: boolean;
  onStatusChange: (value: NoticeFilterStatus) => void;
  onEffectiveFromChange: (value: string) => void;
  onEffectiveToChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onCreate: () => void;
};

export function NoticesToolbar(props: NoticesToolbarProps): React.ReactNode {
  const statusText =
    props.statusFilter === 'all'
      ? props.t('admin.notices.filters.all')
      : props.t(`admin.notices.status.${props.statusFilter}`);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:grid-cols-[180px_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
        <Select
          value={props.statusFilter}
          onValueChange={(value: NoticeFilterStatus) => props.onStatusChange(value)}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue>
              {props.t('admin.notices.filters.statusDisplay', { value: statusText })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{props.t('admin.notices.filters.all')}</SelectItem>
            <SelectItem value="active">{props.t('admin.notices.status.active')}</SelectItem>
            <SelectItem value="pending">{props.t('admin.notices.status.pending')}</SelectItem>
            <SelectItem value="revoked">{props.t('admin.notices.status.revoked')}</SelectItem>
            <SelectItem value="expired">{props.t('admin.notices.status.expired')}</SelectItem>
          </SelectContent>
        </Select>
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
