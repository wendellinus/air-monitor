const PROFILE_SETTINGS_PATH = '/admin/profile-settings';
const LOGIN_PATH = '/admin/login';

type AdminRouteRule = {
  path: string;
  anyOfPermissions: string[];
};

const ADMIN_ROUTE_RULES: AdminRouteRule[] = [
  { path: '/admin', anyOfPermissions: ['dashboard.view'] },
  { path: '/admin/users', anyOfPermissions: ['users.view'] },
  { path: '/admin/notices', anyOfPermissions: ['notices.view'] },
  { path: '/admin/cities', anyOfPermissions: ['cities.view'] },
  { path: '/admin/favorites', anyOfPermissions: ['favorites.view'] },
  { path: '/admin/system', anyOfPermissions: ['system.view', 'apiQuota.view'] },
  { path: '/admin/permissions', anyOfPermissions: ['permissions.view'] },
  { path: '/admin/api-quota', anyOfPermissions: ['apiQuota.view'] },
];

function getRouteRule(path: string): AdminRouteRule | undefined {
  return ADMIN_ROUTE_RULES.find((item) => item.path === normalizeAdminPath(path));
}

function normalizeAdminPath(path: string): string {
  if (/^\/admin\/users\/\d+$/.test(path)) {
    return '/admin/users';
  }

  return path;
}

export function canAccessAdminPath(path: string, permissionKeys: string[] | null): boolean {
  const rule = getRouteRule(path);
  if (!rule || rule.anyOfPermissions.length === 0) return true;
  if (!permissionKeys) return false;

  const granted = new Set(permissionKeys);
  return rule.anyOfPermissions.some((key) => granted.has(key));
}

export function findFirstAccessibleAdminPath(permissionKeys: string[] | null): string {
  for (const item of ADMIN_ROUTE_RULES) {
    if (canAccessAdminPath(item.path, permissionKeys)) {
      return item.path;
    }
  }

  return LOGIN_PATH;
}

export function getProfileSettingsPath(): string {
  return PROFILE_SETTINGS_PATH;
}
