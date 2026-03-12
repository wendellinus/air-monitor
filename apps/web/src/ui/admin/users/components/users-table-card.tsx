import React from 'react';
import { Search } from 'lucide-react';
import type { UserRole } from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InitialSkeleton } from '@/ui/admin/components/feedback';
import { AdminFixedTableShell } from '@/ui/admin/components/admin-fixed-table-shell';
import { cn } from '@/lib/utils';
import type { TranslateFn, UserItem } from '@/ui/admin/users/lib/types';

type UsersTableCardProps = {
  t: TranslateFn;
  locale: string;
  users: UserItem[];
  isInitialLoading: boolean;
  pageSize: number;
  onViewDetail: (user: UserItem) => void;
  onEditDetail: (user: UserItem) => void;
  className?: string;
};

function roleBadge(t: TranslateFn, role: UserRole): React.ReactNode {
  if (role === 'admin') return <Badge variant="default">{t('admin.users.role.admin')}</Badge>;
  if (role === 'operator') return <Badge variant="secondary">{t('admin.users.role.operator')}</Badge>;
  return <Badge variant="outline">{t('admin.users.role.user')}</Badge>;
}

function statusBadge(t: TranslateFn, isActive: boolean): React.ReactNode {
  return isActive ? (
    <Badge variant="success">{t('admin.users.status.active')}</Badge>
  ) : (
    <Badge variant="destructive">{t('admin.users.status.disabled')}</Badge>
  );
}

export function UsersTableCard(props: UsersTableCardProps): React.ReactNode {
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
          <col style={{ width: '30%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '180px' }} />
        </colgroup>
      }
      header={
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('admin.users.table.id')}</TableHead>
            <TableHead>{t('admin.users.table.username')}</TableHead>
            <TableHead>{t('admin.users.table.role')}</TableHead>
            <TableHead>{t('admin.users.table.status')}</TableHead>
            <TableHead>{t('admin.users.table.createdAt')}</TableHead>
            <TableHead className="text-right">{t('admin.users.actions.title')}</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={
        <TableBody>
          {props.users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>{t('admin.users.emptyTitle')}</EmptyTitle>
                  <EmptyDescription>{t('admin.users.emptyDesc')}</EmptyDescription>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            props.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{roleBadge(t, user.role)}</TableCell>
                <TableCell>{statusBadge(t, user.isActive)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => props.onViewDetail(user)}>
                      {t('admin.users.actions.detail')}
                    </Button>
                    <Button size="sm" onClick={() => props.onEditDetail(user)}>
                      {t('admin.users.actions.edit')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      }
    />
  );
}
