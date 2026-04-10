import type { PermissionTreeNode, RolePermissionTreeData } from '@air-monitor/shared';
import { Inject, Injectable } from '@nestjs/common';

import { AppError } from '../../shared/app-error';
import type { UserRole } from '../../shared/authz/user-role';
import { UserRoles } from '../../shared/authz/user-role';
import { ErrorCodes } from '../../shared/error-codes';

import { PermissionRepository, type PermissionEntity } from './permission.repository';

type PermissionDefinition = PermissionEntity;

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: 'dashboard.view', label: 'Dashboard (View)', type: 'menu', parentKey: null, sort: 10 },
  { key: 'users.view', label: 'User Management (View)', type: 'menu', parentKey: null, sort: 20 },
  { key: 'users.profile.update', label: 'User Profile (Update)', type: 'action', parentKey: 'users.view', sort: 21 },
  { key: 'users.create', label: 'User (Create)', type: 'action', parentKey: 'users.view', sort: 22 },
  {
    key: 'users.permission.update',
    label: 'User Permissions (Update)',
    type: 'action',
    parentKey: 'users.view',
    sort: 23,
  },
  { key: 'users.status.update', label: 'User Status (Update)', type: 'action', parentKey: 'users.view', sort: 24 },
  { key: 'users.role.update', label: 'User Role (Update)', type: 'action', parentKey: 'users.view', sort: 25 },
  { key: 'users.password.reset', label: 'User Password (Reset)', type: 'action', parentKey: 'users.view', sort: 26 },
  { key: 'users.delete', label: 'User (Soft Delete)', type: 'action', parentKey: 'users.view', sort: 27 },
  { key: 'notices.view', label: 'Notice Management (View)', type: 'menu', parentKey: null, sort: 30 },
  { key: 'notices.create', label: 'Notice (Create)', type: 'action', parentKey: 'notices.view', sort: 31 },
  { key: 'notices.publish', label: 'Notice (Publish/Unpublish)', type: 'action', parentKey: 'notices.view', sort: 32 },
  { key: 'cities.view', label: 'City Monitoring (View)', type: 'menu', parentKey: null, sort: 40 },
  { key: 'favorites.view', label: 'Favorites Management (View)', type: 'menu', parentKey: null, sort: 50 },
  { key: 'favorites.delete', label: 'Favorite Record (Delete)', type: 'action', parentKey: 'favorites.view', sort: 51 },
  { key: 'system.view', label: 'System Settings (View)', type: 'menu', parentKey: null, sort: 60 },
  { key: 'system.update', label: 'System Configuration (Update)', type: 'action', parentKey: 'system.view', sort: 61 },
  { key: 'permissions.view', label: 'Permission Management (View)', type: 'menu', parentKey: null, sort: 70 },
  {
    key: 'permissions.update',
    label: 'Role Permissions (Update)',
    type: 'action',
    parentKey: 'permissions.view',
    sort: 71,
  },
  { key: 'apiQuota.view', label: 'API Quota Center (View)', type: 'menu', parentKey: null, sort: 80 },
  { key: 'apiQuota.refresh', label: 'API Quota Center (Refresh)', type: 'action', parentKey: 'apiQuota.view', sort: 81 },
  {
    key: 'apiQuota.config.update',
    label: 'API Quota Center (Config Update)',
    type: 'action',
    parentKey: 'apiQuota.view',
    sort: 82,
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: PERMISSION_DEFINITIONS.map((item) => item.key),
  operator: [
    'dashboard.view',
    'users.view',
    'users.profile.update',
    'users.create',
    'users.status.update',
    'users.password.reset',
    'notices.view',
    'notices.create',
    'notices.publish',
    'cities.view',
    'favorites.view',
    'favorites.delete',
    'system.view',
    'apiQuota.view',
  ],
  user: [],
};

const ROLE_REQUIRED_ADDITIONS: Partial<Record<UserRole, string[]>> = {
  operator: ['users.profile.update'],
};

export type UserPermissionDetail = {
  rolePermissionKeys: string[];
  deniedPermissionKeys: string[];
  effectivePermissionKeys: string[];
  permissionTree: PermissionTreeNode[];
};

@Injectable()
export class PermissionService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(@Inject(PermissionRepository) private readonly repo: PermissionRepository) {}

  async getRolePermissionTree(role: UserRole): Promise<RolePermissionTreeData> {
    await this.ensureInitialized();

    const [allPermissions, selectedKeys] = await Promise.all([
      this.repo.listPermissions(),
      this.repo.listRolePermissionKeys(role),
    ]);

    return {
      role,
      selectedKeys,
      tree: this.toTree(allPermissions),
    };
  }

  async updateRolePermissions(role: UserRole, permissionKeys: string[]): Promise<RolePermissionTreeData> {
    await this.ensureInitialized();
    const allPermissions = await this.repo.listPermissions();
    const allKeys = new Set(allPermissions.map((item) => item.key));
    const normalized = Array.from(new Set(permissionKeys.filter((key) => allKeys.has(key))));

    await this.repo.replaceRolePermissions(role, normalized);
    return this.getRolePermissionTree(role);
  }

  async getMyPermissionKeys(userId: number, role: UserRole): Promise<string[]> {
    await this.ensureInitialized();
    const detail = await this.getUserPermissionDetail(userId, role);
    return detail.effectivePermissionKeys;
  }

  async getUserPermissionDetail(userId: number, role: UserRole): Promise<UserPermissionDetail> {
    await this.ensureInitialized();

    const [allPermissions, rolePermissionKeys, deniedPermissionKeys] = await Promise.all([
      this.repo.listPermissions(),
      this.repo.listRolePermissionKeys(role),
      this.repo.listUserDeniedPermissionKeys(userId),
    ]);

    const rolePermissionSet = new Set(rolePermissionKeys);
    const normalizedDeniedPermissionKeys = Array.from(
      new Set(deniedPermissionKeys.filter((key) => rolePermissionSet.has(key))),
    );
    const deniedSet = new Set(normalizedDeniedPermissionKeys);

    return {
      rolePermissionKeys,
      deniedPermissionKeys: normalizedDeniedPermissionKeys,
      effectivePermissionKeys: rolePermissionKeys.filter((key) => !deniedSet.has(key)),
      permissionTree: this.toTree(allPermissions),
    };
  }

  async replaceUserDeniedPermissions(
    userId: number,
    role: UserRole,
    deniedPermissionKeys: string[],
  ): Promise<UserPermissionDetail> {
    await this.ensureInitialized();

    const rolePermissionKeys = await this.repo.listRolePermissionKeys(role);
    const rolePermissionSet = new Set(rolePermissionKeys);
    const normalized = Array.from(new Set(deniedPermissionKeys));
    const invalidKeys = normalized.filter((key) => !rolePermissionSet.has(key));

    if (invalidKeys.length > 0) {
      throw new AppError(ErrorCodes.ParamError, 'Only role permissions can be removed from a user.');
    }

    await this.repo.replaceUserDeniedPermissions(userId, normalized);
    return this.getUserPermissionDetail(userId, role);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      const expectedKeys = new Set(PERMISSION_DEFINITIONS.map((item) => item.key));
      const existingPermissions = await this.repo.listPermissions();
      const deprecatedKeys = existingPermissions
        .map((item) => item.key)
        .filter((key) => !expectedKeys.has(key));

      if (deprecatedKeys.length > 0) {
        await this.repo.deletePermissionsByKeys(deprecatedKeys);
      }

      await this.repo.upsertPermissions(PERMISSION_DEFINITIONS);

      for (const role of UserRoles) {
        const existing = await this.repo.listRolePermissionKeys(role);
        if (existing.length === 0) {
          await this.repo.replaceRolePermissions(role, DEFAULT_ROLE_PERMISSIONS[role]);
          continue;
        }

        if (role === 'admin') {
          await this.repo.replaceRolePermissions(role, PERMISSION_DEFINITIONS.map((item) => item.key));
          continue;
        }

        const requiredAdditions = ROLE_REQUIRED_ADDITIONS[role] ?? [];
        if (requiredAdditions.length > 0) {
          const merged = Array.from(new Set([...existing, ...requiredAdditions]));
          if (merged.length !== existing.length) {
            await this.repo.replaceRolePermissions(role, merged);
          }
        }
      }

      this.initialized = true;
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private toTree(list: PermissionEntity[]): PermissionTreeNode[] {
    const childrenByParent = new Map<string | null, PermissionEntity[]>();
    for (const item of list) {
      const group = childrenByParent.get(item.parentKey) ?? [];
      group.push(item);
      childrenByParent.set(item.parentKey, group);
    }

    const buildNode = (item: PermissionEntity): PermissionTreeNode => ({
      key: item.key,
      label: item.label,
      type: item.type,
      children: (childrenByParent.get(item.key) ?? []).map(buildNode),
    });

    return (childrenByParent.get(null) ?? []).map(buildNode);
  }
}
