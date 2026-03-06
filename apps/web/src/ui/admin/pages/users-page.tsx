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
    roleFilter,
    statusFilter,
    createdFrom,
    createdTo,
    isInitialLoading,
    isRefreshing,
    resetTarget,
    newPassword,
    resetting,
    setPage,
    setInputValue,
    setRoleFilter,
    setStatusFilter,
    setCreatedFrom,
    setCreatedTo,
    setNewPassword,
    handleSearch,
    clearSearch,
    clearFilters,
    refresh,
    toggleActive,
    setRole,
    openResetDialog,
    closeResetDialog,
    submitResetPassword,
  } = useAdminUsers({ t });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 800 });

  return (
    <PageShell
      title={t('admin.users.title')}
      description={t('admin.users.total', { total })}
      fitHeight
      bodyClassName="min-h-0"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <UsersToolbar
          t={t}
          inputValue={inputValue}
          keyword={keyword}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          createdFrom={createdFrom}
          createdTo={createdTo}
          isRefreshing={isRefreshing}
          isInitialLoading={isInitialLoading}
          refreshLocked={refreshAction.locked}
          onInputChange={setInputValue}
          onSearch={handleSearch}
          onClearSearch={clearSearch}
          onRoleChange={(value) => {
            setPage(1);
            setRoleFilter(value);
          }}
          onStatusChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          onCreatedFromChange={(value) => {
            setPage(1);
            setCreatedFrom(value);
          }}
          onCreatedToChange={(value) => {
            setPage(1);
            setCreatedTo(value);
          }}
          onClearFilters={clearFilters}
          onRefresh={refreshAction.run}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <UsersTableCard
            t={t}
            locale={locale}
            users={users}
            isInitialLoading={isInitialLoading}
            pageSize={pageSize}
            className="h-full"
            onToggleActive={(user) => void toggleActive(user)}
            onSetRole={(user, role) => void setRole(user, role)}
            onOpenResetDialog={openResetDialog}
          />
        </div>

        <div className="shrink-0">
          <UsersPagination
            t={t}
            page={page}
            totalPages={totalPages}
            isRefreshing={isRefreshing}
            onPrevPage={() => setPage((current) => current - 1)}
            onNextPage={() => setPage((current) => current + 1)}
          />
        </div>
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
