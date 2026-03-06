import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import type { CityRow, TranslateFn } from '@/ui/admin/cities/lib/types';

type CitiesToolbarProps = {
  t: TranslateFn;
  table: Table<CityRow>;
  isLoading: boolean;
  isFetching: boolean;
  refreshLocked: boolean;
  columnNameMap: Record<string, string>;
  onRefresh: () => void;
};

export function CitiesToolbar(props: CitiesToolbarProps): React.ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder={props.t('admin.cities.filterPlaceholder')}
        value={(props.table.getColumn('city')?.getFilterValue() as string) ?? ''}
        onChange={(event) => props.table.getColumn('city')?.setFilterValue(event.target.value)}
        className="h-9 w-full max-w-sm"
      />
      <RefreshIconButton
        label={props.t('admin.common.refresh')}
        size="sm"
        onClick={props.onRefresh}
        loading={(props.isFetching && !props.isLoading) || props.refreshLocked}
        disabled={props.isFetching || props.refreshLocked}
        className="ml-auto"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {props.t('admin.cities.columns')}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {props.table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
              >
                {props.columnNameMap[column.id as keyof typeof props.columnNameMap] ?? column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
