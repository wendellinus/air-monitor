import React from 'react';
import { Navigate } from 'react-router-dom';

import { Spinner } from '@/components/ui/spinner';

import { useAdminAccess } from './access-context';

export function RequireAdminRouteAccess(props: {
  path: string;
  children: React.ReactNode;
}): React.ReactNode {
  const { permissionsReady, canAccessPath, firstAccessiblePath } = useAdminAccess();

  if (!permissionsReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-5 w-5 text-primary" />
      </div>
    );
  }

  if (canAccessPath(props.path)) {
    return props.children;
  }

  return <Navigate to={firstAccessiblePath} replace />;
}
