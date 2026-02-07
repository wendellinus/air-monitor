import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { getAccessToken } from './auth';
import { AdminLayout } from '../ui/admin-layout';
import { AdminLoginPage } from '../ui/admin-login-page';
import { AdminRegisterPage } from '../ui/admin-register-page';
import { PlanPage } from '../ui/plan-page';
import { ScreenPage } from '../ui/screen-page';

function RequireAuth(props: { children: React.ReactNode }): React.ReactNode {
  const token = getAccessToken();
  if (!token) return <Navigate to="/admin/login" replace />;
  return props.children;
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/screen" replace /> },
  { path: '/screen', element: <ScreenPage /> },
  { path: '/plan', element: <PlanPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },
  { path: '/admin/register', element: <AdminRegisterPage /> },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
  },
]);
