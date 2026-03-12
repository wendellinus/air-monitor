import React from 'react';

import { canAccessAdminPath, findFirstAccessibleAdminPath } from './admin-route-access';

type AccessContextValue = {
  permissionKeys: string[] | null;
  permissionsReady: boolean;
  hasPermission: (key: string) => boolean;
  canAccessPath: (path: string) => boolean;
  firstAccessiblePath: string;
};

const AccessContext = React.createContext<AccessContextValue | null>(null);

export function AdminAccessProvider(props: {
  permissionKeys: string[] | null;
  permissionsReady: boolean;
  children: React.ReactNode;
}): React.ReactNode {
  const value = React.useMemo<AccessContextValue>(() => {
    const permissions = props.permissionKeys ? new Set(props.permissionKeys) : null;
    return {
      permissionKeys: props.permissionKeys,
      permissionsReady: props.permissionsReady,
      hasPermission: (key: string): boolean => {
        if (!permissions) return false;
        return permissions.has(key);
      },
      canAccessPath: (path: string): boolean => canAccessAdminPath(path, props.permissionKeys),
      firstAccessiblePath: findFirstAccessibleAdminPath(props.permissionKeys),
    };
  }, [props.permissionKeys, props.permissionsReady]);

  return <AccessContext.Provider value={value}>{props.children}</AccessContext.Provider>;
}

export function useAdminAccess(): AccessContextValue {
  const context = React.useContext(AccessContext);
  if (!context) {
    throw new Error('useAdminAccess must be used within AdminAccessProvider.');
  }
  return context;
}
