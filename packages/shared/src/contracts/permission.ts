import type { UserRole } from '../user-role';

export type PermissionNodeType = 'menu' | 'action';

export type PermissionTreeNode = {
  key: string;
  label: string;
  type: PermissionNodeType;
  children: PermissionTreeNode[];
};

export type RolePermissionTreeData = {
  role: UserRole;
  selectedKeys: string[];
  tree: PermissionTreeNode[];
};

export type UpdateRolePermissionsRequest = {
  permissionKeys: string[];
};

export type MePermissionsData = {
  role: UserRole;
  permissions: string[];
};
