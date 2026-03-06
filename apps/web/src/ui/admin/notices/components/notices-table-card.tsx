import React from 'react';
import { Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InitialSkeleton } from '@/ui/admin/components/feedback';
import { AdminTableShell, ADMIN_TABLE_STICKY_HEAD_CLASS } from '@/ui/admin/components/admin-table-shell';
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

export function NoticesTableCard(props: NoticesTableCardProps): React.ReactNode {
  const { t, locale } = props;

  if (props.isInitialLoading) {
    return <InitialSkeleton variant="table" rows={props.pageSize} />;
  }

  return (
    <AdminTableShell className={cn(props.className)}>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className={cn('w-12', ADMIN_TABLE_STICKY_HEAD_CLASS)}>{t('admin.notices.table.id')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.notices.table.title')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.notices.table.level')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.notices.table.status')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.notices.table.start')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.notices.table.end')}</TableHead>
          <TableHead className={cn('text-right', ADMIN_TABLE_STICKY_HEAD_CLASS)}>
            {t('admin.notices.table.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.notices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8">
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
              <TableCell className="max-w-[280px] truncate font-medium" title={notice.title}>
                {notice.title}
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => props.onRevoke?.(notice)}
                  disabled={
                    notice.source !== 'manual' ||
                    notice.status === 'revoked' ||
                    notice.status === 'expired' ||
                    props.processingId === notice.id
                  }
                >
                  {props.processingId === notice.id ? t('admin.notices.processing') : t('admin.notices.revoke')}
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </AdminTableShell>
  );
}
