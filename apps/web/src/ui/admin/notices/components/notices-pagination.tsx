import React from 'react';

import { Button } from '@/components/ui/button';
import type { TranslateFn } from '@/ui/admin/notices/lib/types';

type NoticesPaginationProps = {
  t: TranslateFn;
  page: number;
  totalPages: number;
  isRefreshing: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function NoticesPagination(props: NoticesPaginationProps): React.ReactNode {
  if (props.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 border-t border-border/70 pt-3">
      <span className="text-sm text-muted-foreground">
        {props.t('admin.notices.page', { page: props.page, total: props.totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={props.page <= 1 || props.isRefreshing}
        onClick={props.onPrevPage}
      >
        {props.t('admin.notices.prev')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={props.page >= props.totalPages || props.isRefreshing}
        onClick={props.onNextPage}
      >
        {props.t('admin.notices.next')}
      </Button>
    </div>
  );
}
