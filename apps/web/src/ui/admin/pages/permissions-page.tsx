import React from 'react';
import type { UserRole } from '@air-monitor/shared';
import { ShieldCheck } from 'lucide-react';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AsyncButton, InitialSkeleton, InlineLoader } from '@/ui/admin/components/feedback';
import { PageShell } from '@/ui/admin/components/page-shell';
import { useAdminAccess } from '@/ui/admin/layout/access-context';
import { TransferActions, TransferPanel } from '@/ui/admin/permissions/components';
import { usePermissionsTransfer } from '@/ui/admin/permissions/hooks';
import { ROLE_OPTIONS } from '@/ui/admin/permissions/lib';
import { useI18n } from '@/shared/i18n';

export function AdminPermissionsPage(): React.ReactNode {
  const { t } = useI18n();
  const { hasPermission } = useAdminAccess();
  const {
    targetRole,
    setTargetRole,
    typeLabels,
    isInitialLoading,
    loading,
    saving,
    allPermissions,
    inactivePermissions,
    activePermissions,
    inactiveChecked,
    activeChecked,
    inactiveQuery,
    activeQuery,
    setInactiveQuery,
    setActiveQuery,
    toggleInactiveChecked,
    toggleActiveChecked,
    moveToActive,
    moveToInactive,
    savePermissions,
  } = usePermissionsTransfer({ t });

  if (!hasPermission('permissions.view')) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <ShieldCheck />
        </EmptyMedia>
        <EmptyTitle>{t('admin.access.deniedTitle')}</EmptyTitle>
        <EmptyDescription>{t('admin.access.deniedDesc')}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <PageShell
      fitHeight
      title={t('admin.permissions.title')}
      description={t('admin.permissions.desc')}
      bodyClassName="min-h-0 overflow-hidden"
      action={
        <AsyncButton
          onClick={() => void savePermissions()}
          disabled={loading}
          isLoading={saving}
          loadingText={t('admin.permissions.saving')}
          className="h-10 rounded-lg px-4"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          {t('admin.permissions.save')}
        </AsyncButton>
      }
    >
      <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <span className="text-sm font-medium text-slate-600">{t('admin.permissions.role')}</span>
          <Select value={targetRole} onValueChange={(value: UserRole) => setTargetRole(value)}>
            <SelectTrigger className="h-10 w-[220px] border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {t(`admin.users.role.${role}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && !isInitialLoading ? (
            <InlineLoader label={t('admin.common.refreshing')} className="ml-2" />
          ) : null}
        </div>

        {isInitialLoading ? (
          <InitialSkeleton variant="mixed" className="min-h-0" />
        ) : loading ? (
          <div className="min-h-0 rounded-lg border bg-card p-8 text-center text-muted-foreground">
            {t('admin.permissions.loading')}
          </div>
        ) : allPermissions.length === 0 ? (
          <div className="min-h-0 overflow-auto rounded-lg border bg-card p-8">
            <Empty>
              <EmptyMedia variant="icon">
                <ShieldCheck />
              </EmptyMedia>
              <EmptyTitle>{t('admin.permissions.emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('admin.permissions.emptyDesc')}</EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="grid h-full min-h-0 gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_190px_minmax(0,1fr)]">
            <TransferPanel
              title={t('admin.permissions.transfer.inactiveTitle')}
              searchPlaceholder={t('admin.permissions.transfer.inactiveSearch')}
              emptyText={t('admin.permissions.transfer.inactiveEmpty')}
              badgeText={typeLabels}
              query={inactiveQuery}
              onQueryChange={setInactiveQuery}
              items={inactivePermissions}
              checked={inactiveChecked}
              checkedCount={inactiveChecked.size}
              onToggle={toggleInactiveChecked}
              side="left"
            />

            <TransferActions
              t={t}
              inactivePermissionsLength={inactivePermissions.length}
              inactiveCheckedSize={inactiveChecked.size}
              activeCheckedSize={activeChecked.size}
              activePermissionsLength={activePermissions.length}
              onActivateAll={() => moveToActive(inactivePermissions.map((item) => item.key))}
              onActivateSelected={() => moveToActive(inactiveChecked)}
              onDeactivateSelected={() => moveToInactive(activeChecked)}
              onDeactivateAll={() => moveToInactive(activePermissions.map((item) => item.key))}
            />

            <TransferPanel
              title={t('admin.permissions.transfer.activeTitle')}
              searchPlaceholder={t('admin.permissions.transfer.activeSearch')}
              emptyText={t('admin.permissions.transfer.activeEmpty')}
              badgeText={typeLabels}
              query={activeQuery}
              onQueryChange={setActiveQuery}
              items={activePermissions}
              checked={activeChecked}
              checkedCount={activeChecked.size}
              onToggle={toggleActiveChecked}
              side="right"
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
