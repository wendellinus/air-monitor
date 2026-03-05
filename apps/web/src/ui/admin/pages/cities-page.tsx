import React from 'react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { useI18n } from '@/shared/i18n';
import { PageShell } from '@/ui/admin/components/page-shell';
import { CitiesPagination, CitiesTableCard, CitiesToolbar } from '@/ui/admin/cities/components';
import { useAdminCitiesTable } from '@/ui/admin/cities/hooks';

export function AdminCitiesPage(): React.ReactNode {
  const { t } = useI18n();
  const { table, isLoading, isFetching, refetch, columnsCount, columnNameMap } = useAdminCitiesTable(t);
  const refreshAction = useRateLimitedAction(() => refetch(), { cooldownMs: 800 });

  return (
    <PageShell title={t('admin.cities.title')} description={t('admin.cities.desc')}>
      <div className="space-y-3">
        <CitiesToolbar
          t={t}
          table={table}
          isLoading={isLoading}
          isFetching={isFetching}
          refreshLocked={refreshAction.locked}
          columnNameMap={columnNameMap}
          onRefresh={refreshAction.run}
        />

        <CitiesTableCard t={t} table={table} columnsCount={columnsCount} isLoading={isLoading} />

        <CitiesPagination t={t} table={table} />
      </div>
    </PageShell>
  );
}
