import React from 'react';
import { Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { AsyncButton, InitialSkeleton } from '@/ui/admin/components/feedback';
import type { AdminNoticeItem, TranslateFn } from '@/ui/admin/notices/lib/types';

type NoticesTableCardProps = {
  t: TranslateFn;
  locale: string;
  notices: AdminNoticeItem[];
  isInitialLoading: boolean;
  publishingId: number | string | null;
  pageSize: number;
  onTogglePublish: (notice: AdminNoticeItem) => void;
};

function statusBadge(t: TranslateFn, locale: string, status: string): React.ReactNode {
  if (status === 'active') return <Badge variant="success">{t('admin.notices.status.active')}</Badge>;
  if (status === 'pending') return <Badge variant="warning">{t('admin.notices.status.pending')}</Badge>;
  if (status === 'revoked') {
    return <Badge variant="secondary">{locale.startsWith('zh') ? '已撤销' : 'Revoked'}</Badge>;
  }
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
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-12">{t('admin.notices.table.id')}</TableHead>
            <TableHead>{t('admin.notices.table.title')}</TableHead>
            <TableHead>{t('admin.notices.table.level')}</TableHead>
            <TableHead>{t('admin.notices.table.status')}</TableHead>
            <TableHead>{t('admin.notices.table.start')}</TableHead>
            <TableHead>{t('admin.notices.table.end')}</TableHead>
            <TableHead className="w-24" />
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
                <TableCell>{statusBadge(t, locale, notice.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(notice.startTime).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(notice.endTime).toLocaleDateString(locale)}
                </TableCell>
                <TableCell>
                  <AsyncButton
                    variant="outline"
                    size="sm"
                    onClick={() => props.onTogglePublish(notice)}
                    isLoading={props.publishingId === notice.id}
                    loadingText={locale.startsWith('zh') ? '处理中...' : 'Processing...'}
                    disabled={notice.status === 'expired'}
                  >
                    {notice.status === 'active' ? t('admin.notices.unpublish') : t('admin.notices.publish')}
                  </AsyncButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
