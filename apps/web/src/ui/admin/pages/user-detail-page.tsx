import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, PencilLine, RotateCcw, Save, ShieldCheck, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AsyncButton, InitialSkeleton } from '@/ui/admin/components/feedback';
import { TransferActions, TransferPanel } from '@/ui/admin/permissions/components';
import { ResetPasswordDialog } from '@/ui/admin/users/components';
import { useAdminUserDetail } from '@/ui/admin/users/hooks';
import { useI18n } from '@/shared/i18n';

function roleBadge(t: (key: string) => string, role: 'admin' | 'operator' | 'user'): React.ReactNode {
  if (role === 'admin') return <Badge variant="default">{t('admin.users.role.admin')}</Badge>;
  if (role === 'operator') return <Badge variant="secondary">{t('admin.users.role.operator')}</Badge>;
  return <Badge variant="outline">{t('admin.users.role.user')}</Badge>;
}

function statusBadge(t: (key: string) => string, isActive: boolean): React.ReactNode {
  return isActive ? (
    <Badge variant="success">{t('admin.users.status.active')}</Badge>
  ) : (
    <Badge variant="destructive">{t('admin.users.status.disabled')}</Badge>
  );
}

export function AdminUserDetailPage(): React.ReactNode {
  const { t, locale } = useI18n();
  const detail = useAdminUserDetail({ t });
  const hasTargetUser = detail.userDetail !== null;
  const dateTimeFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  const actionBar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {hasTargetUser && detail.canResetPassword ? (
        <Button variant="outline" className="h-10 rounded-xl px-4 shadow-sm" onClick={detail.openResetDialog}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('admin.users.actions.resetPassword')}
        </Button>
      ) : null}

      {hasTargetUser && detail.canEditAny && !detail.isEditing ? (
        <Button className="h-10 rounded-xl px-4 shadow-sm" onClick={detail.enterEdit}>
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          {t('admin.users.actions.edit')}
        </Button>
      ) : null}

      {hasTargetUser && detail.canEditAny && detail.isEditing ? (
        <>
          <Button variant="outline" className="h-10 rounded-xl px-4 shadow-sm" onClick={detail.exitEdit}>
            {t('admin.users.detail.exitEdit')}
          </Button>
          <AsyncButton
            className="h-10 rounded-xl px-4 shadow-sm"
            onClick={() => void detail.save()}
            disabled={!detail.isDirty}
            isLoading={detail.isSaving}
            loadingText={t('admin.users.detail.saving')}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {t('admin.users.detail.save')}
          </AsyncButton>
        </>
      ) : null}

      {hasTargetUser && detail.canDelete ? (
        <AsyncButton
          variant="destructive"
          className="h-10 rounded-xl px-4 shadow-sm"
          onClick={() => void detail.deleteUser()}
          isLoading={detail.isDeleting}
          loadingText={t('admin.users.detail.deleting')}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('admin.users.detail.delete')}
        </AsyncButton>
      ) : null}
    </div>
  );

  const titleBar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="size-10 rounded-xl border-slate-200 bg-white shadow-sm"
        >
          <Link to="/admin/users" aria-label={t('admin.users.detail.back')}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
          {t('admin.users.detail.title')}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {actionBar}
      </div>
    </div>
  );

  if (detail.isInitialLoading) {
    return <InitialSkeleton variant="mixed" className="h-full min-h-0" />;
  }

  if (!detail.userDetail) {
    return (
      <section className="flex h-full min-h-0 min-w-0 flex-col gap-4">
        {titleBar}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm">
          <div className="p-10">
            <Empty>
              <EmptyMedia variant="icon">
                <ShieldCheck aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t('admin.users.detail.emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('admin.users.detail.emptyDesc')}</EmptyDescription>
            </Empty>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col gap-4">
      {titleBar}

      <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-200/80 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-2xl font-semibold text-slate-900">{detail.userDetail.username}</div>
              <p className="mt-1 text-sm text-slate-500">{t('admin.users.detail.summary')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusBadge(t, detail.isActive)}
              {roleBadge(t, detail.userDetail.role)}
              <Badge variant={detail.isEditing ? 'default' : 'outline'}>
                {detail.isEditing
                  ? t('admin.users.detail.mode.editing')
                  : t('admin.users.detail.mode.viewing')}
              </Badge>
            </div>
          </div>
          <p className="mt-5 text-sm text-slate-500">{t('admin.users.detail.meta.ruleValue')}</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-detail-username">{t('admin.users.detail.field.username')}</Label>
              <Input
                id="user-detail-username"
                name="username"
                autoComplete="off"
                spellCheck={false}
                value={detail.username}
                readOnly={!detail.isEditing || !detail.canEditProfile}
                disabled={!detail.isEditing || !detail.canEditProfile}
                onChange={(event) => detail.setUsername(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-detail-status">{t('admin.users.detail.field.status')}</Label>
              <div className="flex min-h-11 items-center justify-between px-1">
                <span className="text-sm font-medium text-slate-700">
                  {detail.isActive ? t('admin.users.status.active') : t('admin.users.status.disabled')}
                </span>
                <Switch
                  id="user-detail-status"
                  checked={detail.isActive}
                  disabled={!detail.isEditing || !detail.canEditStatus}
                  onCheckedChange={detail.setIsActive}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.users.detail.field.role')}</Label>
              <div className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4">
                {roleBadge(t, detail.userDetail.role)}
                <span className="text-xs text-slate-500">{t('admin.users.detail.roleReadonly')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.users.detail.field.createdAt')}</Label>
              <div className="flex min-h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 tabular-nums">
                {dateTimeFormatter.format(new Date(detail.userDetail.createdAt))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200/80 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[1.75rem] font-semibold tracking-tight text-slate-950">
                {t('admin.users.detail.field.permissions')}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {detail.canEditPermissions
                  ? t('admin.users.detail.workspaceDesc')
                  : t('admin.users.detail.permissionsReadonly')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {t('admin.users.detail.permissionsEnabled', {
                  total: detail.activePermissions.length,
                })}
              </Badge>
              <Badge variant="outline">
                {t('admin.users.detail.permissionsDisabled', {
                  total: detail.inactivePermissions.length,
                })}
              </Badge>
            </div>
          </div>

          {detail.rolePermissions.length === 0 ? (
            <div className="pt-6">
              <Empty>
                <EmptyMedia variant="icon">
                  <ShieldCheck aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{t('admin.users.detail.permissionsEmptyTitle')}</EmptyTitle>
                <EmptyDescription>{t('admin.users.detail.permissionsEmptyDesc')}</EmptyDescription>
              </Empty>
            </div>
          ) : (
            <div className="mt-6 grid min-h-[30rem] gap-4 xl:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)]">
              <TransferPanel
                title={t('admin.permissions.transfer.inactiveTitle')}
                searchPlaceholder={t('admin.permissions.transfer.inactiveSearch')}
                emptyText={t('admin.permissions.transfer.inactiveEmpty')}
                badgeText={detail.typeLabels}
                query={detail.inactiveQuery}
                onQueryChange={detail.setInactiveQuery}
                items={detail.inactivePermissions}
                checked={detail.inactiveChecked}
                checkedCount={detail.inactiveChecked.size}
                onToggle={detail.toggleInactiveChecked}
                disabled={!detail.isEditing || !detail.canEditPermissions}
              />

              {detail.isEditing && detail.canEditPermissions ? (
                <TransferActions
                  t={t}
                  inactivePermissionsLength={detail.inactivePermissions.length}
                  inactiveCheckedSize={detail.inactiveChecked.size}
                  activeCheckedSize={detail.activeChecked.size}
                  activePermissionsLength={detail.activePermissions.length}
                  onActivateAll={() => detail.moveToActive(detail.inactivePermissions.map((item) => item.key))}
                  onActivateSelected={() => detail.moveToActive(detail.inactiveChecked)}
                  onDeactivateSelected={() => detail.moveToInactive(detail.activeChecked)}
                  onDeactivateAll={() => detail.moveToInactive(detail.activePermissions.map((item) => item.key))}
                />
              ) : (
                <div className="flex min-h-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center text-sm leading-7 text-slate-500">
                  {t('admin.users.detail.permissionsHint')}
                </div>
              )}

              <TransferPanel
                title={t('admin.permissions.transfer.activeTitle')}
                searchPlaceholder={t('admin.permissions.transfer.activeSearch')}
                emptyText={t('admin.permissions.transfer.activeEmpty')}
                badgeText={detail.typeLabels}
                query={detail.activeQuery}
                onQueryChange={detail.setActiveQuery}
                items={detail.activePermissions}
                checked={detail.activeChecked}
                checkedCount={detail.activeChecked.size}
                onToggle={detail.toggleActiveChecked}
                disabled={!detail.isEditing || !detail.canEditPermissions}
              />
            </div>
          )}
        </div>
      </div>

      <ResetPasswordDialog
        t={t}
        target={detail.resetTarget}
        newPassword={detail.newPassword}
        resetting={detail.resetting}
        onPasswordChange={detail.setNewPassword}
        onClose={detail.closeResetDialog}
        onConfirm={() => void detail.submitResetPassword()}
      />
    </section>
  );
}
