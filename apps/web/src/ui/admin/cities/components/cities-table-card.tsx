import React from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import { MapPin } from 'lucide-react';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InitialSkeleton } from '@/ui/admin/components/feedback';
import { CITY_TABLE_PAGE_SIZE, type CityRow, type TranslateFn } from '@/ui/admin/cities/lib/types';

type CitiesTableCardProps = {
  t: TranslateFn;
  table: Table<CityRow>;
  columnsCount: number;
  isLoading: boolean;
};

export function CitiesTableCard(props: CitiesTableCardProps): React.ReactNode {
  if (props.isLoading) {
    return <InitialSkeleton variant="table" rows={CITY_TABLE_PAGE_SIZE} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
      <UITable>
        <TableHeader className="bg-muted/30">
          {props.table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
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
      </UITable>
    </div>
  );
}
