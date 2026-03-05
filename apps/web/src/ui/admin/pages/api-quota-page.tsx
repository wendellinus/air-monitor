import React from 'react';
import { Activity } from 'lucide-react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import { useI18n } from '@/shared/i18n';
import { PageContentSpin } from '@/ui/admin/components/page-content-spin';
import { PageShell } from '@/ui/admin/components/page-shell';
import { useAdminAccess } from '@/ui/admin/layout/access-context';
import {
  ApiQuotaProviderCard,
} from '@/ui/admin/api-quota/components';
import { useApiQuotaData } from '@/ui/admin/api-quota/hooks';

export function AdminApiQuotaPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const { hasPermission } = useAdminAccess();
  const {
    overview,
    overviewLoading,
    refresh,
    refreshPending,
  } = useApiQuotaData({ t });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 900 });

  if (!hasPermission('apiQuota.view')) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Activity />
        </EmptyMedia>
        <EmptyTitle>{t('admin.access.deniedTitle')}</EmptyTitle>
        <EmptyDescription>{t('admin.access.deniedDesc')}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <PageShell
      fitHeight
      title={t('admin.apiQuota.title')}
      description={t('admin.apiQuota.desc')}
      bodyClassName="min-h-0 overflow-hidden"
      action={
        hasPermission('apiQuota.refresh') ? (
          <RefreshIconButton
            size="sm"
            label={t('admin.apiQuota.refresh')}
            onClick={refreshAction.run}
            disabled={refreshPending || refreshAction.locked}
          />
        ) : undefined
      }
    >
      <PageContentSpin spinning={refreshPending} tip={t('admin.common.refreshing')} className="h-full min-h-0">
        <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto xl:grid-cols-2">
          <ApiQuotaProviderCard
            t={t}
            locale={locale}
            provider="qweather"
            overviewItem={overview?.providers.find((item) => item.provider === 'qweather')}
            overviewLoading={overviewLoading}
            refreshPending={refreshPending}
          />
          <ApiQuotaProviderCard
            t={t}
            locale={locale}
            provider="amap"
            overviewItem={overview?.providers.find((item) => item.provider === 'amap')}
            overviewLoading={overviewLoading}
            refreshPending={refreshPending}
          />
        </div>
      </PageContentSpin>
    </PageShell>
  );
}
