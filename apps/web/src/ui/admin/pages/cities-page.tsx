import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import type { CityItem } from '@air-monitor/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/shared/api';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';

export function AdminCitiesPage(): React.ReactNode {
  const { t } = useI18n();
  const { data: cities, isLoading } = useQuery({
    queryKey: ['admin-top-cities'],
    queryFn: async (): Promise<CityItem[]> => {
      const response = await api.get<ApiResponse<CityItem[]>>('/city/top', {
        params: { rangeType: 'cn', number: 20 },
      });
      return response.data.data;
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t('admin.cities.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('admin.cities.desc')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{t('admin.cities.cardTitle')}</CardTitle>
            <CardDescription>{t('admin.cities.cardDesc')}</CardDescription>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <MapPin className="size-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-16">{t('admin.cities.table.country')}</TableHead>
                  <TableHead>{t('admin.cities.table.city')}</TableHead>
                  <TableHead>{t('admin.cities.table.region')}</TableHead>
                  <TableHead>{t('admin.cities.table.coordinates')}</TableHead>
                  <TableHead className="text-right">{t('admin.cities.table.cityId')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      {t('admin.cities.loading')}
                    </TableCell>
                  </TableRow>
                ) : cities && cities.length > 0 ? (
                  cities.map((city) => (
                    <TableRow key={city.cityId} className="hover:bg-muted/20">
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-slate-500">
                          {city.country}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{city.name}</TableCell>
                      <TableCell className="text-slate-600">
                        {city.adm1}
                        {city.adm2 && city.adm2 !== city.name ? ` / ${city.adm2}` : ''}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {city.lat}, {city.lon}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-500">
                        {city.cityId}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8">
                      <Empty>
                        <EmptyMedia variant="icon">
                          <MapPin />
                        </EmptyMedia>
                        <EmptyTitle>{t('admin.cities.emptyTitle')}</EmptyTitle>
                        <EmptyDescription>{t('admin.cities.emptyDesc')}</EmptyDescription>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
