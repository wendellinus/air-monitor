import React from 'react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { useI18n } from '@/shared/i18n';
import { PageShell } from '@/ui/admin/components/page-shell';
import { CitiesPagination, CitiesTableCard, CitiesToolbar } from '@/ui/admin/cities/components';
import { useAdminCitiesTable } from '@/ui/admin/cities/hooks';

export function AdminCitiesPage(): React.ReactNode {
  const { t } = useI18n();
  const { table, isLoading, isFetching, keyword, setKeyword, refetch, columnsCount, columnNameMap } =
    useAdminCitiesTable(t);
  const refreshAction = useRateLimitedAction(() => refetch(), { cooldownMs: 800 });

  return (
    <PageShell
      title={t('admin.cities.title')}
      description={t('admin.cities.desc')}
      fitHeight
      bodyClassName="min-h-0 overflow-auto"
    >
      <div className="flex min-h-0 flex-col gap-3">
        <CitiesToolbar
          t={t}
          table={table}
          keyword={keyword}
          isLoading={isLoading}
          isFetching={isFetching}
          refreshLocked={refreshAction.locked}
          columnNameMap={columnNameMap}
          onKeywordChange={setKeyword}
          onRefresh={refreshAction.run}
        />

        <div className="min-h-0 overflow-hidden">
          <CitiesTableCard
            t={t}
            table={table}
            columnsCount={columnsCount}
            isLoading={isLoading}
            className="max-h-[min(70vh,720px)]"
          />
        </div>

        <div className="shrink-0">
          <CitiesPagination t={t} table={table} />
        </div>
      </div>
    </PageShell>
  );
}
