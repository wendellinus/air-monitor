import React from 'react';

import { Table } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type AdminTableShellProps = {
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
  scrollClassName?: string;
};

export const ADMIN_TABLE_STICKY_HEAD_CLASS =
  'sticky top-0 z-20 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/85';

export function AdminTableShell(props: AdminTableShellProps): React.ReactNode {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm', props.className)}>
      <Table
        className={props.tableClassName}
        containerClassName={cn('h-full overflow-auto [scrollbar-gutter:stable]', props.scrollClassName)}
      >
        {props.children}
      </Table>
    </div>
  );
}
