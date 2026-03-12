import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { PageShell } from '@/ui/admin/components/page-shell';
import { UsersPagination, UsersTableCard, UsersToolbar } from '@/ui/admin/users/components';
import { useAdminUsers } from '@/ui/admin/users/hooks';
import { useI18n } from '@/shared/i18n';

export function AdminUsersPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
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
    setPage,
    setInputValue,
    setRoleFilter,
    setStatusFilter,
    setCreatedFrom,
    setCreatedTo,
    handleSearch,
    clearSearch,
    clearFilters,
    refresh,
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
            onViewDetail={(user) => navigate(`/admin/users/${user.id}`)}
            onEditDetail={(user) => navigate(`/admin/users/${user.id}?mode=edit`)}
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
    </PageShell>
  );
}
