import React from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import { MapPin } from 'lucide-react';

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
import { CITY_TABLE_PAGE_SIZE, type CityRow, type TranslateFn } from '@/ui/admin/cities/lib/types';

type CitiesTableCardProps = {
  t: TranslateFn;
  table: Table<CityRow>;
  columnsCount: number;
  isLoading: boolean;
  className?: string;
};

export function CitiesTableCard(props: CitiesTableCardProps): React.ReactNode {
  if (props.isLoading) {
    return <InitialSkeleton variant="table" rows={CITY_TABLE_PAGE_SIZE} />;
  }

  return (
    <AdminFixedTableShell
      className={cn(props.className)}
      colGroup={
        <colgroup>
          {props.table.getVisibleLeafColumns().map((column) => {
            const widthMap: Record<string, string> = {
              country: '15%',
              city: '15%',
              region: '28%',
              coordinates: '24%',
              cityId: '18%',
            };
            return <col key={column.id} style={{ width: widthMap[column.id] ?? `${100 / props.columnsCount}%` }} />;
          })}
        </colgroup>
      }
      header={
        <TableHeader>
          {props.table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
      }
      body={
        <TableBody>
          {props.table.getRowModel().rows.length > 0 ? (
            props.table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={props.columnsCount} className="py-10">
                <Empty>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>{props.t('admin.cities.emptyTitle')}</EmptyTitle>
                  <EmptyDescription>{props.t('admin.cities.emptyDesc')}</EmptyDescription>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      }
    />
  );
}
