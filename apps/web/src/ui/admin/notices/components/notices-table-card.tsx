import React from 'react';
import { Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InitialSkeleton } from '@/ui/admin/components/feedback';
import { AdminFixedTableShell } from '@/ui/admin/components/admin-fixed-table-shell';
import { cn } from '@/lib/utils';
import type { AdminNoticeItem, TranslateFn } from '@/ui/admin/notices/lib/types';

type NoticesTableCardProps = {
  t: TranslateFn;
  locale: string;
  notices: AdminNoticeItem[];
  isInitialLoading: boolean;
  pageSize: number;
  processingId?: number | string | null;
  onRevoke?: (notice: AdminNoticeItem) => void;
  className?: string;
};

function statusBadge(t: TranslateFn, status: string): React.ReactNode {
  if (status === 'active') return <Badge variant="success">{t('admin.notices.status.active')}</Badge>;
  if (status === 'pending') return <Badge variant="warning">{t('admin.notices.status.pending')}</Badge>;
  if (status === 'revoked') return <Badge variant="secondary">{t('admin.notices.status.revoked')}</Badge>;
  return <Badge variant="outline">{t('admin.notices.status.expired')}</Badge>;
}

function levelBadge(t: TranslateFn, level: string): React.ReactNode {
  return level === 'urgent' ? (
    <Badge variant="destructive">{t('admin.notices.level.urgent')}</Badge>
  ) : (
    <Badge variant="secondary">{t('admin.notices.level.info')}</Badge>
  );
}

function personLabel(t: TranslateFn, notice: AdminNoticeItem): string {
  if (notice.createdByName?.trim()) return notice.createdByName;
  return notice.source === 'manual'
    ? t('admin.notices.person.unknown')
    : t('admin.notices.person.system');
}

export function NoticesTableCard(props: NoticesTableCardProps): React.ReactNode {
  const { t, locale } = props;

  if (props.isInitialLoading) {
    return <InitialSkeleton variant="table" rows={props.pageSize} />;
  }

  return (
    <AdminFixedTableShell
      className={cn(props.className)}
      colGroup={
        <colgroup>
          <col style={{ width: '72px' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '112px' }} />
        </colgroup>
      }
      header={
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('admin.notices.table.id')}</TableHead>
            <TableHead>{t('admin.notices.table.title')}</TableHead>
            <TableHead>{t('admin.notices.table.person')}</TableHead>
            <TableHead>{t('admin.notices.table.level')}</TableHead>
            <TableHead>{t('admin.notices.table.status')}</TableHead>
            <TableHead>{t('admin.notices.table.start')}</TableHead>
            <TableHead>{t('admin.notices.table.end')}</TableHead>
            <TableHead className="text-right">{t('admin.notices.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={
        <TableBody>
          {props.notices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Bell />
                  </EmptyMedia>
                  <EmptyTitle>{t('admin.notices.emptyTitle')}</EmptyTitle>
                  <EmptyDescription>{t('admin.notices.emptyDesc')}</EmptyDescription>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            props.notices.map((notice) => (
              <TableRow key={notice.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{notice.id}</TableCell>
                <TableCell className="truncate font-medium" title={notice.title}>
                  {notice.title}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {personLabel(t, notice)}
                </TableCell>
                <TableCell>{levelBadge(t, notice.level)}</TableCell>
                <TableCell>{statusBadge(t, notice.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(notice.startTime).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(notice.endTime).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-right">
                  {notice.source === 'manual' && notice.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => props.onRevoke?.(notice)}
                      disabled={props.processingId === notice.id}
                    >
                      {props.processingId === notice.id ? t('admin.notices.processing') : t('admin.notices.revoke')}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      }
    />
  );
}
