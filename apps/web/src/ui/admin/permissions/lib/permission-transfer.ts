import type { PermissionNodeType, PermissionTreeNode, UserRole } from '@air-monitor/shared';

export const ROLE_OPTIONS: UserRole[] = ['admin', 'operator', 'user'];

export type PermissionFlatItem = {
  key: string;
  label: string;
  type: PermissionNodeType;
  path: string;
};

const PERMISSION_LABEL_KEY_MAP: Record<string, string> = {
  'dashboard.view': 'admin.permissions.node.dashboardView',
  'users.view': 'admin.permissions.node.usersView',
  'users.status.update': 'admin.permissions.node.usersStatusUpdate',
  'users.role.update': 'admin.permissions.node.usersRoleUpdate',
  'users.password.reset': 'admin.permissions.node.usersPasswordReset',
  'notices.view': 'admin.permissions.node.noticesView',
  'notices.create': 'admin.permissions.node.noticesCreate',
  'notices.publish': 'admin.permissions.node.noticesPublish',
  'cities.view': 'admin.permissions.node.citiesView',
  'favorites.view': 'admin.permissions.node.favoritesView',
  'favorites.delete': 'admin.permissions.node.favoritesDelete',
  'system.view': 'admin.permissions.node.systemView',
  'system.update': 'admin.permissions.node.systemUpdate',
  'permissions.view': 'admin.permissions.node.permissionsView',
  'permissions.update': 'admin.permissions.node.permissionsUpdate',
  'apiQuota.view': 'admin.permissions.node.apiQuotaView',
  'apiQuota.refresh': 'admin.permissions.node.apiQuotaRefresh',
  'apiQuota.config.update': 'admin.permissions.node.apiQuotaConfigUpdate',
};

export function resolvePermissionLabel(
  t: (key: string) => string,
  key: string,
  fallbackLabel: string,
): string {
  const labelKey = PERMISSION_LABEL_KEY_MAP[key];
  return labelKey ? t(labelKey) : fallbackLabel;
}

export function flattenPermissionNodes(
  nodes: PermissionTreeNode[],
  t: (key: string) => string,
  parentLabels: string[] = [],
): PermissionFlatItem[] {
  const result: PermissionFlatItem[] = [];
  for (const node of nodes) {
    const normalizedLabel = resolvePermissionLabel(t, node.key, node.label);
    const currentLabels = [...parentLabels, normalizedLabel];
    result.push({
      key: node.key,
      label: normalizedLabel,
      type: node.type,
      path: currentLabels.join(' / '),
    });
    if (node.children.length > 0) {
      result.push(...flattenPermissionNodes(node.children, t, currentLabels));
    }
  }
  return result;
}
