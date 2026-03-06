import React from 'react';

import { Button } from '@/components/ui/button';
import type { TranslateFn } from '@/ui/admin/favorites/lib/types';

type FavoritesPaginationProps = {
  t: TranslateFn;
  page: number;
  totalPages: number;
  isRefreshing: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function FavoritesPagination(props: FavoritesPaginationProps): React.ReactNode {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-3">
      <span className="text-sm text-muted-foreground">
        {props.t('admin.favorites.page', { page: props.page, total: props.totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={props.page <= 1 || props.isRefreshing}
        onClick={props.onPrevPage}
      >
        {props.t('admin.favorites.prev')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={props.page >= props.totalPages || props.isRefreshing}
        onClick={props.onNextPage}
      >
        {props.t('admin.favorites.next')}
      </Button>
    </div>
  );
}
