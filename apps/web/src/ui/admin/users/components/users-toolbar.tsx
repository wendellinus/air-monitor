import React from 'react';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { TranslateFn, UserFilterRole, UserFilterStatus } from '@/ui/admin/users/lib/types';

type UsersToolbarProps = {
  t: TranslateFn;
  inputValue: string;
  keyword: string;
  roleFilter: UserFilterRole;
  statusFilter: UserFilterStatus;
  createdFrom: string;
  createdTo: string;
  isRefreshing: boolean;
  isInitialLoading: boolean;
  refreshLocked: boolean;
  onInputChange: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onRoleChange: (value: UserFilterRole) => void;
  onStatusChange: (value: UserFilterStatus) => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
};

export function UsersToolbar(props: UsersToolbarProps): React.ReactNode {
  const roleText =
    props.roleFilter === 'all' ? props.t('admin.users.filters.all') : props.t(`admin.users.role.${props.roleFilter}`);
  const statusText =
    props.statusFilter === 'all'
      ? props.t('admin.users.filters.all')
      : props.t(`admin.users.status.${props.statusFilter}`);

  const hasFilters =
    props.roleFilter !== 'all' ||
    props.statusFilter !== 'all' ||
    Boolean(props.createdFrom) ||
    Boolean(props.createdTo);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder={props.t('admin.users.search.placeholder')}
            value={props.inputValue}
            onChange={(event) => props.onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              props.onSearch();
            }}
          />
        </div>
        <Button variant="outline" className="h-10 px-4" onClick={props.onSearch}>
          {props.t('admin.users.search.search')}
        </Button>
        {props.keyword ? (
          <Button variant="ghost" className="h-10 px-4" onClick={props.onClearSearch}>
            {props.t('admin.users.search.clear')}
          </Button>
        ) : null}
        <RefreshIconButton
          label={props.t('admin.common.refresh')}
          onClick={props.onRefresh}
          loading={props.isRefreshing || props.refreshLocked}
          disabled={props.isRefreshing || props.isInitialLoading || props.refreshLocked}
          className="h-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[180px_180px_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
        <Select
          value={props.roleFilter}
          onValueChange={(value: UserFilterRole) => props.onRoleChange(value)}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue>
              {props.t('admin.users.filters.roleDisplay', { value: roleText })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{props.t('admin.users.filters.all')}</SelectItem>
            <SelectItem value="admin">{props.t('admin.users.role.admin')}</SelectItem>
            <SelectItem value="operator">{props.t('admin.users.role.operator')}</SelectItem>
            <SelectItem value="user">{props.t('admin.users.role.user')}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={props.statusFilter}
          onValueChange={(value: UserFilterStatus) => props.onStatusChange(value)}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue>
              {props.t('admin.users.filters.statusDisplay', { value: statusText })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{props.t('admin.users.filters.all')}</SelectItem>
            <SelectItem value="active">{props.t('admin.users.status.active')}</SelectItem>
            <SelectItem value="disabled">{props.t('admin.users.status.disabled')}</SelectItem>
          </SelectContent>
        </Select>

        <DateTimePicker
          className="h-10"
          value={props.createdFrom}
          onChange={props.onCreatedFromChange}
          placeholder={props.t('admin.users.filters.createdFrom')}
        />
        <DateTimePicker
          className="h-10"
          value={props.createdTo}
          onChange={props.onCreatedToChange}
          placeholder={props.t('admin.users.filters.createdTo')}
        />

        <Button
          variant="outline"
          onClick={props.onClearFilters}
          disabled={!hasFilters}
          className="h-10 justify-self-start px-4 xl:justify-self-end"
        >
          {props.t('admin.users.filters.reset')}
        </Button>
      </div>
    </div>
  );
}
