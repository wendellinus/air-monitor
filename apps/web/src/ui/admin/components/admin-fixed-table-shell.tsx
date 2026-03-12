import React from 'react';

import { cn } from '@/lib/utils';

type AdminFixedTableShellProps = {
  header: React.ReactNode;
  body: React.ReactNode;
  colGroup?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  scrollClassName?: string;
};

export function AdminFixedTableShell(props: AdminFixedTableShellProps): React.ReactNode {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm',
        props.className,
      )}
    >
      <div className="shrink-0 border-b border-border/70 bg-muted/30">
        <table className={cn('w-full table-fixed caption-bottom text-sm', props.tableClassName)}>
          {props.colGroup}
          {props.header}
        </table>
      </div>

      <div className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden', props.scrollClassName)}>
        <table className={cn('w-full table-fixed caption-bottom text-sm', props.tableClassName)}>
          {props.colGroup}
          {props.body}
        </table>
      </div>
    </div>
  );
}
