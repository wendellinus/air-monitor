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
    publishingId,
    form,
    setPage,
    setCreateOpen,
    setForm,
    refresh,
    openCreateDialog,
    togglePublish,
    createNotice,
  } = useAdminNotices({ t });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 800 });

  return (
    <PageShell title={t('admin.notices.title')} description={t('admin.notices.total', { total })}>
      <div className="space-y-3">
        <NoticesToolbar
          t={t}
          isRefreshing={isRefreshing}
          isInitialLoading={isInitialLoading}
          refreshLocked={refreshAction.locked}
          onRefresh={refreshAction.run}
          onCreate={openCreateDialog}
        />

        <NoticesTableCard
          t={t}
          locale={locale}
          notices={notices}
          isInitialLoading={isInitialLoading}
          publishingId={publishingId}
          pageSize={pageSize}
          onTogglePublish={(notice) => void togglePublish(notice)}
        />

        <NoticesPagination
          t={t}
          page={page}
          totalPages={totalPages}
          isRefreshing={isRefreshing}
          onPrevPage={() => setPage((current) => current - 1)}
          onNextPage={() => setPage((current) => current + 1)}
        />
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
