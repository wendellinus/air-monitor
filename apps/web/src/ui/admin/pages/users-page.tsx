import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AdminUserDetailData } from '@air-monitor/shared';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { api } from '@/shared/api';
import { encryptRegisterPasswordTransport } from '@/shared/http/password-protection';
import { PageShell } from '@/ui/admin/components/page-shell';
import { useAdminAccess } from '@/ui/admin/layout/access-context';
import { CreateUserDialog, UsersPagination, UsersTableCard, UsersToolbar } from '@/ui/admin/users/components';
import { useAdminUsers } from '@/ui/admin/users/hooks';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';
import type { AdminCreateUserRequest, CreateUserDialogValues } from '@/ui/admin/users/lib/types';

export function AdminUsersPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { hasPermission } = useAdminAccess();
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
  const [createOpen, setCreateOpen] = React.useState<boolean>(false);
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const canCreate = hasPermission('users.create');
  const canAssignRole = hasPermission('users.role.update');
  const canSetStatus = hasPermission('users.status.update');

  const handleCreateUser = React.useCallback(
    async (values: CreateUserDialogValues): Promise<void> => {
      setIsCreating(true);
      try {
        const payload: AdminCreateUserRequest = {
          username: values.username.trim(),
          ...(await encryptRegisterPasswordTransport(values.password.trim())),
        };
        if (canAssignRole && values.role !== 'user') {
          payload.role = values.role;
        }
        if (canSetStatus && !values.isActive) {
          payload.isActive = false;
        }

        const response = await api.post<ApiResponse<AdminUserDetailData>>('/admin/users', payload);
        const createdUser = response.data.data;
        toast.success(t('admin.users.create.success', { username: createdUser.username }));
        setCreateOpen(false);
        navigate(`/admin/users/${createdUser.id}`);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.users.create.fail'));
      } finally {
        setIsCreating(false);
      }
    },
    [canAssignRole, canSetStatus, navigate, t],
  );

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
          canCreate={canCreate}
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
          onCreate={() => setCreateOpen(true)}
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

      <CreateUserDialog
        t={t}
        open={createOpen}
        isSubmitting={isCreating}
        canAssignRole={canAssignRole}
        canSetStatus={canSetStatus}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateUser}
      />
    </PageShell>
  );
}
