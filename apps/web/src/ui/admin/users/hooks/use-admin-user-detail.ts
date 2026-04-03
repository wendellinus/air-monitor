import React from 'react';
import { useBeforeUnload, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type {
  AdminResetPasswordRequest,
  AdminUpdateUserDetailRequest,
  AdminUserDetailData,
} from '@air-monitor/shared';

import { api } from '@/shared/api';
import { encryptNewPasswordTransport } from '@/shared/http/password-protection';
import type { ApiResponse } from '@/shared/types';
import { useAdminAccess } from '@/ui/admin/layout/access-context';
import {
  flattenPermissionNodes,
  type PermissionFlatItem,
} from '@/ui/admin/permissions/lib/permission-transfer';
import type { TranslateFn } from '@/ui/admin/users/lib/types';

type UseAdminUserDetailInput = {
  t: TranslateFn;
};

type UseAdminUserDetailResult = {
  userId: number | null;
  userDetail: AdminUserDetailData | null;
  username: string;
  isActive: boolean;
  isEditing: boolean;
  isDirty: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  resetting: boolean;
  newPassword: string;
  resetTarget: { id: number; username: string } | null;
  canEditProfile: boolean;
  canEditPermissions: boolean;
  canEditAny: boolean;
  canDelete: boolean;
  canResetPassword: boolean;
  rolePermissions: PermissionFlatItem[];
  activePermissions: PermissionFlatItem[];
  inactivePermissions: PermissionFlatItem[];
  activeChecked: Set<string>;
  inactiveChecked: Set<string>;
  activeQuery: string;
  inactiveQuery: string;
  typeLabels: { menu: string; action: string };
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  setNewPassword: React.Dispatch<React.SetStateAction<string>>;
  setActiveQuery: React.Dispatch<React.SetStateAction<string>>;
  setInactiveQuery: React.Dispatch<React.SetStateAction<string>>;
  toggleActiveChecked: (key: string, checked: boolean) => void;
  toggleInactiveChecked: (key: string, checked: boolean) => void;
  moveToActive: (keys: Iterable<string>) => void;
  moveToInactive: (keys: Iterable<string>) => void;
  enterEdit: () => void;
  exitEdit: () => void;
  refresh: () => Promise<void>;
  save: () => Promise<void>;
  deleteUser: () => Promise<void>;
  openResetDialog: () => void;
  closeResetDialog: () => void;
  submitResetPassword: () => Promise<void>;
};

export function useAdminUserDetail(input: UseAdminUserDetailInput): UseAdminUserDetailResult {
  const { t } = input;
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAdminAccess();

  const userId = React.useMemo(() => {
    const value = Number(id);
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [id]);

  const [userDetail, setUserDetail] = React.useState<AdminUserDetailData | null>(null);
  const [username, setUsername] = React.useState<string>('');
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());
  const [inactiveChecked, setInactiveChecked] = React.useState<Set<string>>(new Set());
  const [activeChecked, setActiveChecked] = React.useState<Set<string>>(new Set());
  const [inactiveQuery, setInactiveQuery] = React.useState<string>('');
  const [activeQuery, setActiveQuery] = React.useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [resetTarget, setResetTarget] = React.useState<{ id: number; username: string } | null>(null);
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [resetting, setResetting] = React.useState<boolean>(false);
  const firstLoadRef = React.useRef<boolean>(true);

  const canEditProfile = hasPermission('users.profile.update');
  const canEditPermissions = hasPermission('users.permission.update');
  const canEditAny = canEditProfile || canEditPermissions;
  const canDelete = hasPermission('users.delete');
  const canResetPassword = hasPermission('users.password.reset');
  const isEditing = searchParams.get('mode') === 'edit';

  const isDirty = React.useMemo(() => {
    if (!userDetail) return false;

    if (canEditProfile) {
      if (username !== userDetail.username) return true;
      if (isActive !== userDetail.isActive) return true;
    }

    if (canEditPermissions) {
      const currentKeys = new Set(userDetail.effectivePermissionKeys);
      if (currentKeys.size !== selectedPermissions.size) return true;
      for (const key of selectedPermissions) {
        if (!currentKeys.has(key)) return true;
      }
    }

    return false;
  }, [
    canEditPermissions,
    canEditProfile,
    isActive,
    selectedPermissions,
    userDetail,
    username,
  ]);
  const shouldWarnBeforeLeave = isEditing && isDirty;

  const typeLabels = React.useMemo(
    () => ({
      menu: t('admin.permissions.badge.menu'),
      action: t('admin.permissions.badge.action'),
    }),
    [t],
  );

  const syncDraft = React.useCallback((detail: AdminUserDetailData): void => {
    setUsername(detail.username);
    setIsActive(detail.isActive);
    setSelectedPermissions(new Set(detail.effectivePermissionKeys));
    setInactiveChecked(new Set());
    setActiveChecked(new Set());
    setInactiveQuery('');
    setActiveQuery('');
  }, []);

  const updateMode = React.useCallback(
    (mode: 'edit' | null): void => {
      const next = new URLSearchParams(searchParams);
      if (mode) {
        next.set('mode', mode);
      } else {
        next.delete('mode');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const confirmDiscardChanges = React.useCallback((): boolean => {
    if (!shouldWarnBeforeLeave) return true;
    return window.confirm(t('admin.users.detail.leaveConfirm'));
  }, [shouldWarnBeforeLeave, t]);

  const loadDetail = React.useCallback(
    async (mode: 'initial' | 'refresh' = 'refresh'): Promise<void> => {
      if (userId === null) {
        setUserDetail(null);
        setIsInitialLoading(false);
        setIsRefreshing(false);
        toast.error(t('admin.users.detail.loadFail'));
        navigate('/admin/users', { replace: true });
        return;
      }

      if (mode === 'initial') {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await api.get<ApiResponse<AdminUserDetailData>>(`/admin/users/${userId}`);
        const detail = response.data.data;
        setUserDetail(detail);
        syncDraft(detail);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.users.detail.loadFail'));
      } finally {
        if (mode === 'initial') {
          setIsInitialLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [navigate, syncDraft, t, userId],
  );

  React.useEffect(() => {
    const mode = firstLoadRef.current ? 'initial' : 'refresh';
    firstLoadRef.current = false;
    void loadDetail(mode);
  }, [loadDetail]);

  React.useEffect(() => {
    if (isEditing && !canEditAny) {
      updateMode(null);
    }
  }, [canEditAny, isEditing, updateMode]);

  const blocker = useBlocker(shouldWarnBeforeLeave);

  React.useEffect(() => {
    if (blocker.state !== 'blocked') return;

    if (window.confirm(t('admin.users.detail.leaveConfirm'))) {
      blocker.proceed();
      return;
    }

    blocker.reset();
  }, [blocker, t]);

  useBeforeUnload(
    React.useCallback(
      (event) => {
        if (!shouldWarnBeforeLeave) return;
        event.preventDefault();
        event.returnValue = '';
      },
      [shouldWarnBeforeLeave],
    ),
  );

  const rolePermissions = React.useMemo(() => {
    if (!userDetail) return [];
    const rolePermissionSet = new Set(userDetail.rolePermissionKeys);
    return flattenPermissionNodes(userDetail.permissionTree, t)
      .filter((item) => rolePermissionSet.has(item.key))
      .sort((a, b) => a.path.localeCompare(b.path));
  }, [t, userDetail]);

  const inactivePermissions = React.useMemo(() => {
    const keyword = inactiveQuery.trim().toLowerCase();
    return rolePermissions.filter((item) => {
      if (selectedPermissions.has(item.key)) return false;
      if (!keyword) return true;
      return (
        item.key.toLowerCase().includes(keyword) ||
        item.label.toLowerCase().includes(keyword) ||
        item.path.toLowerCase().includes(keyword)
      );
    });
  }, [inactiveQuery, rolePermissions, selectedPermissions]);

  const activePermissions = React.useMemo(() => {
    const keyword = activeQuery.trim().toLowerCase();
    return rolePermissions.filter((item) => {
      if (!selectedPermissions.has(item.key)) return false;
      if (!keyword) return true;
      return (
        item.key.toLowerCase().includes(keyword) ||
        item.label.toLowerCase().includes(keyword) ||
        item.path.toLowerCase().includes(keyword)
      );
    });
  }, [activeQuery, rolePermissions, selectedPermissions]);

  const toggleInactiveChecked = React.useCallback((key: string, checked: boolean): void => {
    setInactiveChecked((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const toggleActiveChecked = React.useCallback((key: string, checked: boolean): void => {
    setActiveChecked((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const moveToActive = React.useCallback((keys: Iterable<string>): void => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      for (const key of keys) next.add(key);
      return next;
    });
    setInactiveChecked(new Set());
  }, []);

  const moveToInactive = React.useCallback((keys: Iterable<string>): void => {
    setSelectedPermissions((current) => {
      const next = new Set(current);
      for (const key of keys) next.delete(key);
      return next;
    });
    setActiveChecked(new Set());
  }, []);

  const enterEdit = React.useCallback((): void => {
    if (!canEditAny) return;
    updateMode('edit');
  }, [canEditAny, updateMode]);

  const exitEdit = React.useCallback((): void => {
    if (!confirmDiscardChanges()) return;
    if (userDetail) {
      syncDraft(userDetail);
    }
    updateMode(null);
  }, [confirmDiscardChanges, syncDraft, updateMode, userDetail]);

  const refresh = React.useCallback(async (): Promise<void> => {
    await loadDetail('refresh');
  }, [loadDetail]);

  const save = React.useCallback(async (): Promise<void> => {
    if (!userDetail || userId === null || !canEditAny || !isDirty) return;

    setIsSaving(true);
    try {
      const payload: AdminUpdateUserDetailRequest = {
        username,
        isActive,
        deniedPermissionKeys: userDetail.rolePermissionKeys.filter((key) => !selectedPermissions.has(key)),
      };
      const response = await api.patch<ApiResponse<AdminUserDetailData>>(
        `/admin/users/${userId}`,
        payload,
      );
      const detail = response.data.data;
      setUserDetail(detail);
      syncDraft(detail);
      updateMode(null);
      toast.success(t('admin.users.detail.saveSuccess'));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('admin.users.detail.saveFail'));
    } finally {
      setIsSaving(false);
    }
  }, [canEditAny, isActive, isDirty, selectedPermissions, syncDraft, t, updateMode, userDetail, userId, username]);

  const deleteUser = React.useCallback(async (): Promise<void> => {
    if (!userDetail || userId === null || !canDelete) return;
    if (!window.confirm(t('admin.users.detail.deleteConfirm', { username: userDetail.username }))) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(t('admin.users.detail.deleteSuccess', { username: userDetail.username }));
      navigate('/admin/users', { replace: true });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('admin.users.detail.deleteFail'));
    } finally {
      setIsDeleting(false);
    }
  }, [canDelete, navigate, t, userDetail, userId]);

  const openResetDialog = React.useCallback((): void => {
    if (!userDetail || !canResetPassword) return;
    setResetTarget({ id: userDetail.id, username: userDetail.username });
    setNewPassword('');
  }, [canResetPassword, userDetail]);

  const closeResetDialog = React.useCallback((): void => {
    setResetTarget(null);
    setNewPassword('');
  }, []);

  const submitResetPassword = React.useCallback(async (): Promise<void> => {
    if (!resetTarget) return;
    if (newPassword.trim().length < 6) {
      toast.error(t('admin.users.reset.short'));
      return;
    }

    setResetting(true);
    try {
      const payload: AdminResetPasswordRequest = {
        ...(await encryptNewPasswordTransport(newPassword.trim())),
      };
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, payload);
      toast.success(t('admin.users.reset.success', { username: resetTarget.username }));
      closeResetDialog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('admin.users.reset.fail'));
    } finally {
      setResetting(false);
    }
  }, [closeResetDialog, newPassword, resetTarget, t]);

  return {
    userId,
    userDetail,
    username,
    isActive,
    isEditing,
    isDirty,
    isInitialLoading,
    isRefreshing,
    isSaving,
    isDeleting,
    resetting,
    newPassword,
    resetTarget,
    canEditProfile,
    canEditPermissions,
    canEditAny,
    canDelete,
    canResetPassword,
    rolePermissions,
    activePermissions,
    inactivePermissions,
    activeChecked,
    inactiveChecked,
    activeQuery,
    inactiveQuery,
    typeLabels,
    setUsername,
    setIsActive,
    setNewPassword,
    setActiveQuery,
    setInactiveQuery,
    toggleActiveChecked,
    toggleInactiveChecked,
    moveToActive,
    moveToInactive,
    enterEdit,
    exitEdit,
    refresh,
    save,
    deleteUser,
    openResetDialog,
    closeResetDialog,
    submitResetPassword,
  };
}
