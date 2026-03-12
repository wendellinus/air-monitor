import React from 'react';
import { Star, Trash2 } from 'lucide-react';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AdminFixedTableShell } from '@/ui/admin/components/admin-fixed-table-shell';
import { AsyncButton, InitialSkeleton } from '@/ui/admin/components/feedback';
import { FAVORITES_PAGE_SIZE, type FavoriteItem, type FavoriteMode, type TranslateFn } from '@/ui/admin/favorites/lib/types';

type FavoritesTableCardProps = {
  t: TranslateFn;
  locale: string;
  mode: FavoriteMode;
  isInitialLoading: boolean;
  items: FavoriteItem[];
  removingKey: string | null;
  canRemove: boolean;
  onRemove: (item: FavoriteItem) => void;
  className?: string;
};

type FavoriteColumn = {
  key: string;
  width: string;
  header: React.ReactNode;
  cell: (item: FavoriteItem) => React.ReactNode;
  align?: 'left' | 'right';
};

function formatRegion(item: FavoriteItem): string {
  return [item.country, item.adm1, item.adm2].filter(Boolean).join(' / ');
}

function buildColumns(
  props: Pick<FavoritesTableCardProps, 't' | 'locale' | 'mode' | 'removingKey' | 'canRemove' | 'onRemove'>,
): FavoriteColumn[] {
  const columns: FavoriteColumn[] = [];

  if (props.mode === 'admin') {
    columns.push({
      key: 'user',
      width: '13%',
      header: props.t('admin.favorites.table.user'),
      cell: (item) => <span className="font-medium">{item.username}</span>,
    });
  }

  columns.push(
    {
      key: 'city',
      width: props.mode === 'admin' ? '13%' : '18%',
      header: props.t('admin.favorites.table.city'),
      cell: (item) => item.cityName,
    },
    {
      key: 'region',
      width: props.mode === 'admin' ? '39%' : '47%',
      header: props.t('admin.favorites.table.region'),
      cell: (item) => <span className="text-muted-foreground">{formatRegion(item)}</span>,
    },
    {
      key: 'cityId',
      width: props.mode === 'admin' ? '14%' : '18%',
      header: props.t('admin.favorites.table.cityId'),
      cell: (item) => <span className="font-mono text-xs text-muted-foreground">{item.cityId}</span>,
    },
  );

  if (props.mode === 'admin') {
    columns.push({
      key: 'createdAt',
      width: '15%',
      header: props.t('admin.favorites.table.createdAt'),
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt).toLocaleString(props.locale) : '--'}
        </span>
      ),
    });
  }

  columns.push({
    key: 'actions',
    width: '72px',
    header: props.t('admin.favorites.table.actions'),
    align: 'right',
    cell: (item) =>
      props.canRemove ? (
        <AsyncButton
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => props.onRemove(item)}
          isLoading={props.removingKey === `${item.userId}:${item.cityId}`}
          loadingText=""
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{props.t('admin.favorites.remove')}</span>
        </AsyncButton>
      ) : (
        <span className="text-xs text-muted-foreground">--</span>
      ),
  });

  return columns;
}

export function FavoritesTableCard(props: FavoritesTableCardProps): React.ReactNode {
  const columns = React.useMemo(
    () =>
      buildColumns({
        t: props.t,
        locale: props.locale,
        mode: props.mode,
        removingKey: props.removingKey,
        canRemove: props.canRemove,
        onRemove: props.onRemove,
      }),
    [props.canRemove, props.locale, props.mode, props.onRemove, props.removingKey, props.t],
  );

  if (props.isInitialLoading) {
    return <InitialSkeleton variant="table" rows={FAVORITES_PAGE_SIZE} />;
  }

  return (
    <AdminFixedTableShell
      className={cn(props.className)}
      colGroup={
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
      }
      header={
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className={column.align === 'right' ? 'text-right' : undefined}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      }
      body={
        <TableBody>
          {props.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8">
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
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.align === 'right' ? 'text-right' : undefined}>
                      {column.cell(item)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      }
    />
  );
}
