import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Clock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs } from '@/components/ui/tabs';
import { api } from '@/shared/api';
import { useSystemPollingInterval } from '@/shared/hooks/use-system-polling-interval';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';
import { PageContentSpin } from '@/ui/admin/components/page-content-spin';
import { PageShell } from '@/ui/admin/components/page-shell';
import { RefreshIconButton } from '@/ui/admin/components/feedback';
import { ApiQuotaProviderCard } from '@/ui/admin/api-quota/components';
import { useApiQuotaData } from '@/ui/admin/api-quota/hooks';
import { useAdminAccess } from '@/ui/admin/layout/access-context';
import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';

type SystemConfig = {
  pollingInterval: number;
};

type SystemTab = 'qweather' | 'amap' | 'polling';

const TAB_SET: ReadonlySet<string> = new Set(['qweather', 'amap', 'polling']);

export function AdminSystemPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAdminAccess();
  const queryClient = useQueryClient();

  const canViewSystem = hasPermission('system.view');
  const canUpdateSystem = hasPermission('system.update');
  const canViewApiQuota = hasPermission('apiQuota.view');
  const canRefreshApiQuota = hasPermission('apiQuota.refresh');
  const availableTabs = React.useMemo<SystemTab[]>(() => {
    const nextTabs: SystemTab[] = [];
    if (canViewApiQuota) {
      nextTabs.push('qweather', 'amap');
    }
    if (canViewSystem) {
      nextTabs.push('polling');
    }
    return nextTabs;
  }, [canViewApiQuota, canViewSystem]);

  const tabFromQuery = searchParams.get('tab');
  const resolvedTab: SystemTab = React.useMemo(() => {
    if (tabFromQuery && TAB_SET.has(tabFromQuery) && availableTabs.includes(tabFromQuery as SystemTab)) {
      return tabFromQuery as SystemTab;
    }
    return availableTabs[0] ?? 'polling';
  }, [availableTabs, tabFromQuery]);
  const [activeTab, setActiveTab] = React.useState<SystemTab>(resolvedTab);

  React.useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const applyTab = React.useCallback(
    (tab: string): void => {
      if (!TAB_SET.has(tab) || !availableTabs.includes(tab as SystemTab)) return;
      const nextTab = tab as SystemTab;
      setActiveTab(nextTab);
      const next = new URLSearchParams(searchParams);
      next.set('tab', nextTab);
      setSearchParams(next, { replace: true });
    },
    [availableTabs, searchParams, setSearchParams],
  );

  React.useEffect(() => {
    if (tabFromQuery) return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', activeTab);
    setSearchParams(next, { replace: true });
  }, [activeTab, searchParams, setSearchParams, tabFromQuery]);

  const [intervalSec, setIntervalSec] = React.useState<string>('60');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-system-config'],
    queryFn: async (): Promise<SystemConfig> => {
      const response = await api.get<ApiResponse<SystemConfig>>('/admin/system/config');
      return response.data.data;
    },
  });
  const { pollingIntervalMs } = useSystemPollingInterval();

  const { overview, overviewLoading, refresh, refreshPending } = useApiQuotaData({
    t,
    enabled: canViewApiQuota,
    pollingIntervalMs,
  });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 900 });

  React.useEffect(() => {
    if (!data) return;
    setIntervalSec(String(Math.floor(data.pollingInterval / 1000)));
  }, [data]);

  const currentIntervalSec = React.useMemo<number | null>(
    () => (data ? Math.floor(data.pollingInterval / 1000) : null),
    [data],
  );
  const parsedIntervalSec = Number.parseInt(intervalSec, 10);
  const isIntervalValid = !Number.isNaN(parsedIntervalSec) && parsedIntervalSec >= 5;
  const hasIntervalChanged = currentIntervalSec !== null && parsedIntervalSec !== currentIntervalSec;

  const { mutate: saveConfig, isPending } = useMutation({
    mutationFn: async (sec: number): Promise<void> => {
      await api.post('/admin/system/config', { pollingInterval: sec * 1000 });
    },
    onSuccess: () => {
      toast.success(t('admin.system.saveSuccess'));
      void queryClient.invalidateQueries({ queryKey: ['admin-system-config'] });
      void queryClient.invalidateQueries({ queryKey: ['system-public-config'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t('admin.system.saveFail'));
    },
  });
  const canSavePolling = canUpdateSystem && !isLoading && !isPending && isIntervalValid && hasIntervalChanged;

  function handleSave(): void {
    const value = Number.parseInt(intervalSec, 10);
    if (Number.isNaN(value) || value < 5) {
      toast.error(t('admin.system.polling.minError'));
      return;
    }
    saveConfig(value);
  }

  const textByLocale = React.useCallback(
    (zh: string, en: string): string => (locale.startsWith('zh') ? zh : en),
    [locale],
  );
  const tabSurfaceClassName = 'h-full rounded-2xl bg-gradient-to-b from-slate-50/95 to-slate-100/70 p-5 md:p-6';

  const qweatherTabContent = React.useMemo(
    () => (
      <div className={tabSurfaceClassName}>
        {canViewApiQuota ? (
          <ApiQuotaProviderCard
            t={t}
            locale={locale}
            provider="qweather"
            overviewItem={overview?.providers.find((item) => item.provider === 'qweather')}
            overviewLoading={overviewLoading}
            refreshPending={refreshPending}
            pollingIntervalMs={pollingIntervalMs}
          />
        ) : (
          <Empty>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>{t('admin.access.deniedTitle')}</EmptyTitle>
            <EmptyDescription>{t('admin.access.deniedDesc')}</EmptyDescription>
          </Empty>
        )}
      </div>
    ),
    [canViewApiQuota, locale, overview?.providers, overviewLoading, pollingIntervalMs, refreshPending, t],
  );

  const amapTabContent = React.useMemo(
    () => (
      <div className={tabSurfaceClassName}>
        {canViewApiQuota ? (
          <ApiQuotaProviderCard
            t={t}
            locale={locale}
            provider="amap"
            overviewItem={overview?.providers.find((item) => item.provider === 'amap')}
            overviewLoading={overviewLoading}
            refreshPending={refreshPending}
            pollingIntervalMs={pollingIntervalMs}
          />
        ) : (
          <Empty>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>{t('admin.access.deniedTitle')}</EmptyTitle>
            <EmptyDescription>{t('admin.access.deniedDesc')}</EmptyDescription>
          </Empty>
        )}
      </div>
    ),
    [canViewApiQuota, locale, overview?.providers, overviewLoading, pollingIntervalMs, refreshPending, t],
  );

  const pollingTabContent = React.useMemo(
    () => (
      <div className={tabSurfaceClassName}>
        {canViewSystem ? (
          <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-6 shadow-[0_16px_32px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  <Clock className="size-4" />
                  {t('admin.system.polling.title')}
                </div>
                <p className="text-sm leading-6 text-slate-600">{t('admin.system.polling.desc')}</p>
              </div>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                {textByLocale('\u5f53\u524d\u95f4\u9694', 'Current interval')}:{' '}
                {currentIntervalSec ?? '--'}s
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 md:p-5">
                <Label htmlFor="polling-interval" className="text-sm font-medium text-slate-800">
                  {t('admin.system.polling.label')}
                </Label>
                <Input
                  id="polling-interval"
                  type="number"
                  min={5}
                  value={intervalSec}
                  onChange={(event) => setIntervalSec(event.target.value)}
                  disabled={isLoading || !canUpdateSystem}
                  className="mt-2 h-11 max-w-sm border-slate-200 bg-white text-base"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {textByLocale('\u4fdd\u5b58\u540e\u7acb\u5373\u751f\u6548', 'Takes effect immediately after saving')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[30, 60, 120, 300].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant={String(preset) === intervalSec ? 'default' : 'outline'}
                      className="min-w-14"
                      onClick={() => setIntervalSec(String(preset))}
                      disabled={!canUpdateSystem}
                    >
                      {preset}s
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4 ring-1 ring-slate-200/70 md:p-5">
                <h4 className="text-sm font-semibold text-slate-800">
                  {textByLocale('\u914d\u7f6e\u5efa\u8bae', 'Configuration tips')}
                </h4>
                <div className="mt-3 space-y-2 text-xs leading-6 text-slate-600">
                  <p>{textByLocale('\u63a8\u8350\u533a\u95f4\u4e3a 30s ~ 300s', 'Recommended range: 30s to 300s')}</p>
                  <p>{textByLocale('\u95f4\u9694\u8d8a\u5c0f\uff0c\u6570\u636e\u66f4\u65b0\u8d8a\u5feb', 'Shorter interval means faster updates')}</p>
                  <p>{textByLocale('\u95f4\u9694\u8d8a\u5927\uff0c\u63a5\u53e3\u8bf7\u6c42\u8d8a\u5c11', 'Longer interval reduces API requests')}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200/80 pt-5">
              <Button
                onClick={handleSave}
                disabled={!canSavePolling}
                className="gap-2 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Save className="size-4" />
                {isPending ? t('admin.system.saving') : t('admin.system.save')}
              </Button>
            </div>
          </div>
        ) : (
          <Empty>
            <EmptyMedia variant="icon">
              <Clock />
            </EmptyMedia>
            <EmptyTitle>{t('admin.access.deniedTitle')}</EmptyTitle>
            <EmptyDescription>{t('admin.access.deniedDesc')}</EmptyDescription>
          </Empty>
        )}
      </div>
    ),
    [
      canSavePolling,
      canUpdateSystem,
      canViewSystem,
      currentIntervalSec,
      handleSave,
      intervalSec,
      isLoading,
      isPending,
      t,
      textByLocale,
    ],
  );

  const quotaTabs = React.useMemo(
    () => {
      const tabs: Array<{ title: string; value: string; content: React.ReactNode }> = [];
      if (canViewApiQuota) {
        tabs.push({
          title: t('admin.apiQuota.provider.qweather'),
          value: 'qweather',
          content: qweatherTabContent,
        });
        tabs.push({
          title: t('admin.apiQuota.provider.amap'),
          value: 'amap',
          content: amapTabContent,
        });
      }
      if (canViewSystem) {
        tabs.push({
          title: t('admin.system.polling.title'),
          value: 'polling',
          content: pollingTabContent,
        });
      }
      return tabs;
    },
    [amapTabContent, canViewApiQuota, canViewSystem, pollingTabContent, qweatherTabContent, t],
  );

  const showQuotaRefresh = (activeTab === 'qweather' || activeTab === 'amap') && canRefreshApiQuota;

  return (
    <PageShell
      title={t('admin.system.title')}
      description={t('admin.system.desc')}
      fitHeight
      bodyClassName="min-h-0"
      action={
        showQuotaRefresh ? (
          <RefreshIconButton
            size="sm"
            label={t('admin.apiQuota.refresh')}
            onClick={refreshAction.run}
            loading={refreshPending || refreshAction.locked}
            disabled={refreshPending || refreshAction.locked}
          />
        ) : undefined
      }
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageContentSpin
          spinning={(activeTab === 'qweather' || activeTab === 'amap') && refreshPending}
          tip={t('admin.common.refreshing')}
          className="min-h-0 flex-1"
        >
          <div className="min-h-0 flex-1 overflow-auto px-1 pb-6 pr-1 md:px-2">
            <div className="mx-auto flex h-[calc(100vh-18rem)] min-h-[30rem] max-h-[52rem] w-full max-w-6xl flex-col">
              <Tabs
                tabs={quotaTabs}
                defaultValue={activeTab}
                onValueChange={applyTab}
                motionPreset="admin"
                containerClassName="gap-2 rounded-2xl bg-white p-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
                tabClassName="min-w-[92px] rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                activeTabClassName="border border-slate-200 bg-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.1)]"
                contentWrapperClassName="h-[calc(100%-4rem)]"
                contentClassName="!mt-3 h-full"
              />
            </div>
          </div>
        </PageContentSpin>
      </div>
    </PageShell>
  );
}
