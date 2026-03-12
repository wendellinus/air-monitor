import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type VisibilityState,
} from '@tanstack/react-table';
import type { AdminCityListData } from '@air-monitor/shared';

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
  keyword: string;
  refetch: () => Promise<unknown>;
  setKeyword: React.Dispatch<React.SetStateAction<string>>;
  columnsCount: number;
  columnNameMap: Record<string, string>;
};

export function useAdminCitiesTable(t: TranslateFn): UseAdminCitiesTableResult {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [keyword, setKeyword] = React.useState<string>('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: CITY_TABLE_PAGE_SIZE,
  });

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [keyword]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-cities', pagination.pageIndex, pagination.pageSize, keyword],
    queryFn: async (): Promise<AdminCityListData> => {
      const response = await api.get<ApiResponse<AdminCityListData>>('/city/admin/list', {
        params: {
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
        },
      });
      return response.data.data;
    },
    placeholderData: (previous) => previous,
  });

  const rows = React.useMemo<CityRow[]>(
    () =>
      (data?.list ?? []).map((city) => ({
        country: city.country || '--',
        city: city.name || city.cityId || '--',
        region: formatRegion(city) || '--',
        coordinates: city.lat && city.lon ? `${city.lat}, ${city.lon}` : '--',
        cityId: city.cityId || '--',
      })),
    [data],
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

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pagination.pageSize));

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      pagination,
      columnVisibility,
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
    keyword,
    refetch: () => refetch(),
    setKeyword,
    columnsCount: columns.length,
    columnNameMap,
  };
}
