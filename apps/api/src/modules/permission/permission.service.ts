import { Inject, Injectable } from '@nestjs/common';

import type { PermissionTreeNode, RolePermissionTreeData } from '@air-monitor/shared';

import type { UserRole } from '../../shared/authz/user-role';
import { UserRoles } from '../../shared/authz/user-role';

import { PermissionRepository, type PermissionEntity } from './permission.repository';

type PermissionDefinition = PermissionEntity;

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: 'dashboard.view', label: '仪表盘（查看）', type: 'menu', parentKey: null, sort: 10 },
  { key: 'users.view', label: '用户管理（查看）', type: 'menu', parentKey: null, sort: 20 },
  { key: 'users.status.update', label: '用户状态（修改）', type: 'action', parentKey: 'users.view', sort: 21 },
  { key: 'users.role.update', label: '用户角色（修改）', type: 'action', parentKey: 'users.view', sort: 22 },
  { key: 'users.password.reset', label: '用户密码（重置）', type: 'action', parentKey: 'users.view', sort: 23 },
  { key: 'notices.view', label: '公告管理（查看）', type: 'menu', parentKey: null, sort: 30 },
  { key: 'notices.create', label: '公告（创建）', type: 'action', parentKey: 'notices.view', sort: 31 },
  { key: 'notices.publish', label: '公告（发布/下线）', type: 'action', parentKey: 'notices.view', sort: 32 },
  { key: 'cities.view', label: '城市监控（查看）', type: 'menu', parentKey: null, sort: 40 },
  { key: 'favorites.view', label: '收藏管理（查看）', type: 'menu', parentKey: null, sort: 50 },
  { key: 'favorites.delete', label: '收藏记录（删除）', type: 'action', parentKey: 'favorites.view', sort: 51 },
  { key: 'system.view', label: '系统设置（查看）', type: 'menu', parentKey: null, sort: 60 },
  { key: 'system.update', label: '系统配置（修改）', type: 'action', parentKey: 'system.view', sort: 61 },
  { key: 'permissions.view', label: '权限管理（查看）', type: 'menu', parentKey: null, sort: 70 },
  {
    key: 'permissions.update',
    label: '角色权限（修改）',
    type: 'action',
    parentKey: 'permissions.view',
    sort: 71,
  },
  { key: 'apiQuota.view', label: 'API 配额中心（查看）', type: 'menu', parentKey: null, sort: 80 },
  { key: 'apiQuota.refresh', label: 'API 配额中心（刷新）', type: 'action', parentKey: 'apiQuota.view', sort: 81 },
  {
    key: 'apiQuota.config.update',
    label: 'API 配额中心（配置修改）',
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
  user: ['dashboard.view', 'cities.view', 'favorites.view'],
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

  async getMyPermissionKeys(role: UserRole): Promise<string[]> {
    await this.ensureInitialized();
    return this.repo.listRolePermissionKeys(role);
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
