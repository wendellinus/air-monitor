import React from 'react';
import { toast } from 'sonner';
import type { UserListData } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type {
  TranslateFn,
  UserFilterRole,
  UserFilterStatus,
  UserItem,
  UserPageRole,
} from '@/ui/admin/users/lib/types';

const PAGE_SIZE = 15;

type UseAdminUsersInput = {
  t: TranslateFn;
};

type UseAdminUsersResult = {
  pageSize: number;
  users: UserItem[];
  total: number;
  totalPages: number;
  page: number;
  keyword: string;
  inputValue: string;
  roleFilter: UserFilterRole;
  statusFilter: UserFilterStatus;
  createdFrom: string;
  createdTo: string;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  resetTarget: UserItem | null;
  newPassword: string;
  resetting: boolean;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setRoleFilter: React.Dispatch<React.SetStateAction<UserFilterRole>>;
  setStatusFilter: React.Dispatch<React.SetStateAction<UserFilterStatus>>;
  setCreatedFrom: React.Dispatch<React.SetStateAction<string>>;
  setCreatedTo: React.Dispatch<React.SetStateAction<string>>;
  setNewPassword: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
  clearSearch: () => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  toggleActive: (user: UserItem) => Promise<void>;
  setRole: (user: UserItem, role: UserPageRole) => Promise<void>;
  openResetDialog: (user: UserItem) => void;
  closeResetDialog: () => void;
  submitResetPassword: () => Promise<void>;
};

export function useAdminUsers(input: UseAdminUsersInput): UseAdminUsersResult {
  const { t } = input;
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [page, setPage] = React.useState<number>(1);
  const [keyword, setKeyword] = React.useState<string>('');
  const [inputValue, setInputValue] = React.useState<string>('');
  const [roleFilter, setRoleFilter] = React.useState<UserFilterRole>('all');
  const [statusFilter, setStatusFilter] = React.useState<UserFilterStatus>('all');
  const [createdFrom, setCreatedFrom] = React.useState<string>('');
  const [createdTo, setCreatedTo] = React.useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const [resetTarget, setResetTarget] = React.useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [resetting, setResetting] = React.useState<boolean>(false);
  const firstLoadRef = React.useRef<boolean>(true);

  const totalPages = React.useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadUsers = React.useCallback(
    async (
      targetPage: number,
      kw: string,
      mode: 'initial' | 'refresh' = 'refresh',
    ): Promise<void> => {
      if (mode === 'initial') {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const endpoint = kw.trim() ? '/users/search' : '/users';
        const requestParams: Record<string, string | number | boolean> = {
          page: targetPage,
          pageSize: PAGE_SIZE,
        };
        if (kw.trim()) {
          requestParams.keyword = kw.trim();
        }
        if (roleFilter !== 'all') {
          requestParams.role = roleFilter;
        }
        if (statusFilter !== 'all') {
          requestParams.isActive = statusFilter === 'active';
        }
        if (createdFrom) {
          requestParams.createdFrom = createdFrom;
        }
        if (createdTo) {
          requestParams.createdTo = createdTo;
        }

        const response = await api.get<ApiResponse<UserListData>>(endpoint, {
          params: requestParams,
        });
        setUsers(response.data.data.list);
        setTotal(response.data.data.total);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.users.loadFail'));
      } finally {
        if (mode === 'initial') {
          setIsInitialLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [createdFrom, createdTo, roleFilter, statusFilter, t],
  );

  React.useEffect(() => {
    const mode = firstLoadRef.current ? 'initial' : 'refresh';
    firstLoadRef.current = false;
    void loadUsers(page, keyword, mode);
  }, [createdFrom, createdTo, keyword, loadUsers, page, roleFilter, statusFilter]);

  const handleSearch = React.useCallback((): void => {
    setPage(1);
    setKeyword(inputValue.trim());
  }, [inputValue]);

  const clearSearch = React.useCallback((): void => {
    setInputValue('');
    setKeyword('');
    setPage(1);
  }, []);

  const clearFilters = React.useCallback((): void => {
    setRoleFilter('all');
    setStatusFilter('all');
    setCreatedFrom('');
    setCreatedTo('');
    setPage(1);
  }, []);

  const refresh = React.useCallback(async (): Promise<void> => {
    await loadUsers(page, keyword, 'refresh');
  }, [keyword, loadUsers, page]);

  const toggleActive = React.useCallback(
    async (user: UserItem): Promise<void> => {
      try {
        await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
        setUsers((current) =>
          current.map((item) =>
            item.id === user.id ? { ...item, isActive: !item.isActive } : item,
          ),
        );
        toast.success(t('admin.users.toggleSuccess', { username: user.username }));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.users.toggleFail'));
      }
    },
    [t],
  );

  const setRole = React.useCallback(
    async (user: UserItem, role: UserPageRole): Promise<void> => {
      if (user.role === role) return;
      try {
        await api.patch(`/admin/users/${user.id}/role`, { role });
        setUsers((current) =>
          current.map((item) => (item.id === user.id ? { ...item, role } : item)),
        );
        toast.success(
          t('admin.users.roleSuccess', {
            username: user.username,
            role: t(`admin.users.role.${role}`),
          }),
        );
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : t('admin.users.roleFail'));
      }
    },
    [t],
  );

  const openResetDialog = React.useCallback((user: UserItem): void => {
    setResetTarget(user);
    setNewPassword('');
  }, []);

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
      await api.post(`/admin/users/${resetTarget.id}/reset-password`, {
        newPassword: newPassword.trim(),
      });
      toast.success(t('admin.users.reset.success', { username: resetTarget.username }));
      closeResetDialog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t('admin.users.reset.fail'));
    } finally {
      setResetting(false);
    }
  }, [closeResetDialog, newPassword, resetTarget, t]);

  return {
    pageSize: PAGE_SIZE,
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
  };
}
