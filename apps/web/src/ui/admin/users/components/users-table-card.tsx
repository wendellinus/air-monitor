import React from 'react';
import { MoreHorizontal, RotateCcw, Search, ShieldCheck, UserCog } from 'lucide-react';
import type { UserRole } from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InitialSkeleton } from '@/ui/admin/components/feedback';
import { AdminTableShell, ADMIN_TABLE_STICKY_HEAD_CLASS } from '@/ui/admin/components/admin-table-shell';
import { cn } from '@/lib/utils';
import type { TranslateFn, UserItem } from '@/ui/admin/users/lib/types';

type UsersTableCardProps = {
  t: TranslateFn;
  locale: string;
  users: UserItem[];
  isInitialLoading: boolean;
  pageSize: number;
  onToggleActive: (user: UserItem) => void;
  onSetRole: (user: UserItem, role: UserRole) => void;
  onOpenResetDialog: (user: UserItem) => void;
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
    <AdminTableShell className={cn(props.className)}>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className={cn('w-12', ADMIN_TABLE_STICKY_HEAD_CLASS)}>{t('admin.users.table.id')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.users.table.username')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.users.table.role')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.users.table.status')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{t('admin.users.table.createdAt')}</TableHead>
          <TableHead className={cn('w-12', ADMIN_TABLE_STICKY_HEAD_CLASS)} />
        </TableRow>
      </TableHeader>
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
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('admin.users.actions.open')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('admin.users.actions.title')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => props.onToggleActive(user)}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {user.isActive ? t('admin.users.actions.disable') : t('admin.users.actions.enable')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => props.onSetRole(user, 'admin')}>
                      <UserCog className="mr-2 h-4 w-4" />
                      {t('admin.users.actions.roleAdmin')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => props.onSetRole(user, 'operator')}>
                      <UserCog className="mr-2 h-4 w-4" />
                      {t('admin.users.actions.roleOperator')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => props.onSetRole(user, 'user')}>
                      <UserCog className="mr-2 h-4 w-4" />
                      {t('admin.users.actions.roleUser')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => props.onOpenResetDialog(user)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {t('admin.users.actions.resetPassword')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </AdminTableShell>
  );
}
