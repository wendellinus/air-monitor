import React from 'react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { useI18n } from '@/shared/i18n';
import { PageShell } from '@/ui/admin/components/page-shell';
import {
  CreateNoticeDialog,
  NoticesPagination,
  NoticesTableCard,
  NoticesToolbar,
} from '@/ui/admin/notices/components';
import { useAdminNotices } from '@/ui/admin/notices/hooks';

export function AdminNoticesPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const {
    pageSize,
    notices,
    total,
    totalPages,
    page,
    isInitialLoading,
    isRefreshing,
    createOpen,
    submitting,
    effectiveFrom,
    effectiveTo,
    statusFilter,
    form,
    setPage,
    setCreateOpen,
    setForm,
    setStatusFilter,
    setEffectiveFrom,
    setEffectiveTo,
    clearEffectiveFilters,
    refresh,
    openCreateDialog,
    createNotice,
    revokeNotice,
    publishingId,
  } = useAdminNotices({ t });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 800 });

  return (
    <PageShell
      title={t('admin.notices.title')}
      description={t('admin.notices.total', { total })}
      fitHeight
      bodyClassName="min-h-0"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <NoticesToolbar
          t={t}
          statusFilter={statusFilter}
          effectiveFrom={effectiveFrom}
          effectiveTo={effectiveTo}
          hasActiveFilters={Boolean(statusFilter !== 'all' || effectiveFrom || effectiveTo)}
          isRefreshing={isRefreshing}
          isInitialLoading={isInitialLoading}
          refreshLocked={refreshAction.locked}
          onStatusChange={setStatusFilter}
          onEffectiveFromChange={setEffectiveFrom}
          onEffectiveToChange={setEffectiveTo}
          onClearFilters={clearEffectiveFilters}
          onRefresh={refreshAction.run}
          onCreate={openCreateDialog}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <NoticesTableCard
            t={t}
            locale={locale}
            notices={notices}
            isInitialLoading={isInitialLoading}
            pageSize={pageSize}
            processingId={publishingId}
            onRevoke={(notice) => void revokeNotice(notice)}
            className="h-full"
          />
        </div>

        <div className="shrink-0">
          <NoticesPagination
            t={t}
            page={page}
            totalPages={totalPages}
            isRefreshing={isRefreshing}
            onPrevPage={() => setPage((current) => current - 1)}
            onNextPage={() => setPage((current) => current + 1)}
          />
        </div>
      </div>

      <CreateNoticeDialog
        t={t}
        open={createOpen}
        submitting={submitting}
        form={form}
        setOpen={setCreateOpen}
        onFormChange={setForm}
        onConfirm={() => void createNotice()}
      />
    </PageShell>
  );
}
