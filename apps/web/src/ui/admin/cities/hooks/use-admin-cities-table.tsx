import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import type { CityItem } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  CITY_TABLE_PAGE_SIZE,
  type CityRow,
  formatRegion,
  type TranslateFn,
} from '@/ui/admin/cities/lib/types';

type UseAdminCitiesTableResult = {
  table: ReturnType<typeof useReactTable<CityRow>>;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
  columnsCount: number;
  columnNameMap: Record<string, string>;
};

export function useAdminCitiesTable(t: TranslateFn): UseAdminCitiesTableResult {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const { data: cities, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-top-cities'],
    queryFn: async (): Promise<CityItem[]> => {
      const response = await api.get<ApiResponse<CityItem[]>>('/city/top', {
        params: { rangeType: 'cn', number: 20 },
      });
      return response.data.data;
    },
    staleTime: 60 * 1000,
  });

  const rows = React.useMemo<CityRow[]>(
    () =>
      (cities ?? []).map((city) => ({
        country: city.country || '--',
        city: city.name || city.cityId || '--',
        region: formatRegion(city) || '--',
        coordinates: city.lat && city.lon ? `${city.lat}, ${city.lon}` : '--',
        cityId: city.cityId || '--',
      })),
    [cities],
  );

  const columns = React.useMemo<ColumnDef<CityRow>[]>(
    () => [
      {
        accessorKey: 'country',
        header: () => <div className="px-2 text-sm font-medium text-foreground">{t('admin.cities.table.country')}</div>,
        cell: ({ row }) => <span className="block max-w-[140px] truncate">{row.original.country}</span>,
      },
      {
        accessorKey: 'city',
        header: () => <div className="px-2 text-sm font-medium text-foreground">{t('admin.cities.table.city')}</div>,
        cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.city}</span>,
      },
      {
        accessorKey: 'region',
        header: () => <div className="px-2 text-sm font-medium text-foreground">{t('admin.cities.table.region')}</div>,
        cell: ({ row }) => <span className="block max-w-[180px] truncate">{row.original.region}</span>,
      },
      {
        accessorKey: 'coordinates',
        header: () => (
          <div className="px-2 text-sm font-medium text-foreground">{t('admin.cities.table.coordinates')}</div>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.coordinates}</span>
        ),
      },
      {
        accessorKey: 'cityId',
        header: () => (
          <div className="px-2 text-right text-sm font-medium text-foreground">
            {t('admin.cities.table.cityId')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-mono text-xs text-muted-foreground">{row.original.cityId}</div>
        ),
      },
    ],
    [t],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: CITY_TABLE_PAGE_SIZE,
      },
    },
  });

  const columnNameMap = React.useMemo(
    () => ({
      country: t('admin.cities.table.country'),
      city: t('admin.cities.table.city'),
      region: t('admin.cities.table.region'),
      coordinates: t('admin.cities.table.coordinates'),
      cityId: t('admin.cities.table.cityId'),
    }),
    [t],
  );

  return {
    table,
    isLoading,
    isFetching,
    refetch: () => refetch(),
    columnsCount: columns.length,
    columnNameMap,
  };
}
