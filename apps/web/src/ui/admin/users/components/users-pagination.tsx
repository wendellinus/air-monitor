import React from 'react';

import { Button } from '@/components/ui/button';
import type { TranslateFn } from '@/ui/admin/users/lib/types';

type UsersPaginationProps = {
  t: TranslateFn;
  page: number;
  totalPages: number;
  isRefreshing: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function UsersPagination(props: UsersPaginationProps): React.ReactNode {
  if (props.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-3">
      <span className="text-sm text-muted-foreground">
        {props.t('admin.users.page', { page: props.page, total: props.totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={props.page <= 1 || props.isRefreshing}
        onClick={props.onPrevPage}
      >
        {props.t('admin.users.prev')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={props.page >= props.totalPages || props.isRefreshing}
        onClick={props.onNextPage}
      >
        {props.t('admin.users.next')}
      </Button>
    </div>
  );
}
