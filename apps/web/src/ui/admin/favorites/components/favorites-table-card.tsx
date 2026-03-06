import React from 'react';
import { Star, Trash2 } from 'lucide-react';

import { AsyncButton, InitialSkeleton } from '@/ui/admin/components/feedback';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminTableShell, ADMIN_TABLE_STICKY_HEAD_CLASS } from '@/ui/admin/components/admin-table-shell';
import {
  FAVORITES_PAGE_SIZE,
  type FavoriteItem,
  type TranslateFn,
} from '@/ui/admin/favorites/lib/types';
import { cn } from '@/lib/utils';

type FavoritesTableCardProps = {
  t: TranslateFn;
  locale: string;
  isInitialLoading: boolean;
  items: FavoriteItem[];
  removingKey: string | null;
  onRemove: (item: FavoriteItem) => void;
  className?: string;
};

export function FavoritesTableCard(props: FavoritesTableCardProps): React.ReactNode {
  if (props.isInitialLoading) {
    return <InitialSkeleton variant="table" rows={FAVORITES_PAGE_SIZE} />;
  }

  return (
    <AdminTableShell className={cn(props.className)}>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{props.t('admin.favorites.table.user')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{props.t('admin.favorites.table.city')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{props.t('admin.favorites.table.region')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{props.t('admin.favorites.table.cityId')}</TableHead>
          <TableHead className={ADMIN_TABLE_STICKY_HEAD_CLASS}>{props.t('admin.favorites.table.createdAt')}</TableHead>
          <TableHead className={cn('w-20 text-right', ADMIN_TABLE_STICKY_HEAD_CLASS)}>
            {props.t('admin.favorites.table.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Star />
                </EmptyMedia>
                <EmptyTitle>{props.t('admin.favorites.emptyTitle')}</EmptyTitle>
                <EmptyDescription>{props.t('admin.favorites.emptyDesc')}</EmptyDescription>
              </Empty>
            </TableCell>
          </TableRow>
        ) : (
          props.items.map((item) => {
            const key = `${item.userId}:${item.cityId}`;
            return (
              <TableRow key={key}>
                <TableCell className="font-medium">{item.username}</TableCell>
                <TableCell>{item.cityName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {[item.country, item.adm1, item.adm2].filter(Boolean).join(' / ')}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.cityId}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString(props.locale)}
                </TableCell>
                <TableCell className="text-right">
                  <AsyncButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => props.onRemove(item)}
                    isLoading={props.removingKey === key}
                    loadingText=""
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{props.t('admin.favorites.remove')}</span>
                  </AsyncButton>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </AdminTableShell>
  );
}
