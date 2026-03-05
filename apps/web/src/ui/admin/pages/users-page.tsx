import React from 'react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { PageShell } from '@/ui/admin/components/page-shell';
import {
  ResetPasswordDialog,
  UsersPagination,
  UsersTableCard,
  UsersToolbar,
} from '@/ui/admin/users/components';
import { useAdminUsers } from '@/ui/admin/users/hooks';
import { useI18n } from '@/shared/i18n';

export function AdminUsersPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const {
    pageSize,
    users,
    total,
    totalPages,
    page,
    keyword,
    inputValue,
    isInitialLoading,
    isRefreshing,
    resetTarget,
    newPassword,
    resetting,
    setPage,
    setInputValue,
    setNewPassword,
    handleSearch,
    clearSearch,
    refresh,
    toggleActive,
    setRole,
    openResetDialog,
    closeResetDialog,
    submitResetPassword,
  } = useAdminUsers({ t });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 800 });

  return (
    <PageShell title={t('admin.users.title')} description={t('admin.users.total', { total })}>
      <div className="space-y-3">
        <UsersToolbar
          t={t}
          inputValue={inputValue}
          keyword={keyword}
          isRefreshing={isRefreshing}
          isInitialLoading={isInitialLoading}
          refreshLocked={refreshAction.locked}
          onInputChange={setInputValue}
          onSearch={handleSearch}
          onClearSearch={clearSearch}
          onRefresh={refreshAction.run}
        />

        <UsersTableCard
          t={t}
          locale={locale}
          users={users}
          isInitialLoading={isInitialLoading}
          pageSize={pageSize}
          onToggleActive={(user) => void toggleActive(user)}
          onSetRole={(user, role) => void setRole(user, role)}
          onOpenResetDialog={openResetDialog}
        />

        <UsersPagination
          t={t}
          page={page}
          totalPages={totalPages}
          isRefreshing={isRefreshing}
          onPrevPage={() => setPage((current) => current - 1)}
          onNextPage={() => setPage((current) => current + 1)}
        />
      </div>

      <ResetPasswordDialog
        t={t}
        target={resetTarget}
        newPassword={newPassword}
        resetting={resetting}
        onPasswordChange={setNewPassword}
        onClose={closeResetDialog}
        onConfirm={() => void submitResetPassword()}
      />
    </PageShell>
  );
}
