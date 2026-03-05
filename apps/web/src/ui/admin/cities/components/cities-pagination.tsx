import React from 'react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import type { CityRow, TranslateFn } from '@/ui/admin/cities/lib/types';

type CitiesPaginationProps = {
  t: TranslateFn;
  table: Table<CityRow>;
};

export function CitiesPagination(props: CitiesPaginationProps): React.ReactNode {
  return (
    <div className="flex items-center justify-between border-t border-border/70 pt-3">
      <div className="text-sm text-muted-foreground">
        {props.t('admin.cities.page', {
          page: props.table.getState().pagination.pageIndex + 1,
          total: Math.max(1, props.table.getPageCount()),
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => props.table.previousPage()}
          disabled={!props.table.getCanPreviousPage()}
        >
          {props.t('admin.cities.prev')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => props.table.nextPage()}
          disabled={!props.table.getCanNextPage()}
        >
          {props.t('admin.cities.next')}
        </Button>
      </div>
    </div>
  );
}
