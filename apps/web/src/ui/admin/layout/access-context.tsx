import React from 'react';

type AccessContextValue = {
  permissionKeys: string[] | null;
  hasPermission: (key: string) => boolean;
};

const AccessContext = React.createContext<AccessContextValue | null>(null);

export function AdminAccessProvider(props: {
  permissionKeys: string[] | null;
  children: React.ReactNode;
}): React.ReactNode {
  const value = React.useMemo<AccessContextValue>(() => {
    const permissions = props.permissionKeys ? new Set(props.permissionKeys) : null;
    return {
      permissionKeys: props.permissionKeys,
      hasPermission: (key: string): boolean => {
        if (!permissions) return true;
        return permissions.has(key);
      },
    };
  }, [props.permissionKeys]);

  return <AccessContext.Provider value={value}>{props.children}</AccessContext.Provider>;
}

export function useAdminAccess(): AccessContextValue {
  const context = React.useContext(AccessContext);
  if (!context) {
    throw new Error('useAdminAccess must be used within AdminAccessProvider.');
  }
  return context;
}
