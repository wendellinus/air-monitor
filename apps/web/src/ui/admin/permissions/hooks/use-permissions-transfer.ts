import React from 'react';
import type {
  PermissionTreeNode,
  RolePermissionTreeData,
  UpdateRolePermissionsRequest,
  UserRole,
} from '@air-monitor/shared';
import { toast } from 'sonner';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  flattenPermissionNodes,
  type PermissionFlatItem,
} from '@/ui/admin/permissions/lib/permission-transfer';

type UsePermissionsTransferInput = {
  t: (key: string) => string;
};

type UsePermissionsTransferResult = {
  targetRole: UserRole;
  setTargetRole: React.Dispatch<React.SetStateAction<UserRole>>;
  typeLabels: { menu: string; action: string };
  isInitialLoading: boolean;
  loading: boolean;
  saving: boolean;
  allPermissions: PermissionFlatItem[];
  inactivePermissions: PermissionFlatItem[];
  activePermissions: PermissionFlatItem[];
  inactiveChecked: Set<string>;
  activeChecked: Set<string>;
  inactiveQuery: string;
  activeQuery: string;
  setInactiveQuery: React.Dispatch<React.SetStateAction<string>>;
  setActiveQuery: React.Dispatch<React.SetStateAction<string>>;
  toggleInactiveChecked: (key: string, checked: boolean) => void;
  toggleActiveChecked: (key: string, checked: boolean) => void;
  moveToActive: (keys: Iterable<string>) => void;
  moveToInactive: (keys: Iterable<string>) => void;
  savePermissions: () => Promise<void>;
};

export function usePermissionsTransfer(input: UsePermissionsTransferInput): UsePermissionsTransferResult {
  const { t } = input;
  const [targetRole, setTargetRole] = React.useState<UserRole>('operator');
  const [tree, setTree] = React.useState<PermissionTreeNode[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [inactiveChecked, setInactiveChecked] = React.useState<Set<string>>(new Set());
  const [activeChecked, setActiveChecked] = React.useState<Set<string>>(new Set());
  const [inactiveQuery, setInactiveQuery] = React.useState<string>('');
  const [activeQuery, setActiveQuery] = React.useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [saving, setSaving] = React.useState<boolean>(false);
  const firstLoadRef = React.useRef<boolean>(true);

  const typeLabels = React.useMemo(
    () => ({
      menu: t('admin.permissions.badge.menu'),
      action: t('admin.permissions.badge.action'),
    }),
    [t],
  );

  const loadRoleTree = React.useCallback(
    async (role: UserRole, mode: 'initial' | 'refresh' = 'refresh'): Promise<void> => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<RolePermissionTreeData>>(
          `/admin/permissions/roles/${role}`,
        );
        const data = response.data.data;
        setTree(data.tree);
        setSelected(new Set(data.selectedKeys));
        setInactiveChecked(new Set());
        setActiveChecked(new Set());
        setInactiveQuery('');
        setActiveQuery('');
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : t('admin.permissions.loadFail'));
        setTree([]);
        setSelected(new Set());
      } finally {
        if (mode === 'initial') setIsInitialLoading(false);
        setLoading(false);
      }
    },
    [t],
  );

  React.useEffect(() => {
    const mode = firstLoadRef.current ? 'initial' : 'refresh';
    firstLoadRef.current = false;
    void loadRoleTree(targetRole, mode);
  }, [loadRoleTree, targetRole]);

  const allPermissions = React.useMemo(
    () => flattenPermissionNodes(tree, t).sort((a, b) => a.path.localeCompare(b.path)),
    [tree, t],
  );

  const inactivePermissions = React.useMemo(() => {
    const keyword = inactiveQuery.trim().toLowerCase();
    return allPermissions.filter((item) => {
      if (selected.has(item.key)) return false;
      if (!keyword) return true;
      return (
        item.label.toLowerCase().includes(keyword) ||
        item.path.toLowerCase().includes(keyword) ||
        item.key.toLowerCase().includes(keyword)
      );
    });
  }, [allPermissions, inactiveQuery, selected]);

  const activePermissions = React.useMemo(() => {
    const keyword = activeQuery.trim().toLowerCase();
    return allPermissions.filter((item) => {
      if (!selected.has(item.key)) return false;
      if (!keyword) return true;
      return (
        item.label.toLowerCase().includes(keyword) ||
        item.path.toLowerCase().includes(keyword) ||
        item.key.toLowerCase().includes(keyword)
      );
    });
  }, [activeQuery, allPermissions, selected]);

  const moveToActive = React.useCallback((keys: Iterable<string>): void => {
    setSelected((current) => {
      const next = new Set(current);
      for (const key of keys) next.add(key);
      return next;
    });
    setInactiveChecked(new Set());
  }, []);

  const moveToInactive = React.useCallback((keys: Iterable<string>): void => {
    setSelected((current) => {
      const next = new Set(current);
      for (const key of keys) next.delete(key);
      return next;
    });
    setActiveChecked(new Set());
  }, []);

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

  const savePermissions = React.useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      const payload: UpdateRolePermissionsRequest = {
        permissionKeys: Array.from(selected),
      };
      const response = await api.put<ApiResponse<RolePermissionTreeData>>(
        `/admin/permissions/roles/${targetRole}`,
        payload,
      );
      setSelected(new Set(response.data.data.selectedKeys));
      toast.success(t('admin.permissions.saveSuccess'));
    } catch (errorValue) {
      toast.error(errorValue instanceof Error ? errorValue.message : t('admin.permissions.saveFail'));
    } finally {
      setSaving(false);
    }
  }, [selected, t, targetRole]);

  return {
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
  };
}
