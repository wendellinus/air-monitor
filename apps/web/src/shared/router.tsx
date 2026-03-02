import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { getAccessToken } from './auth';
import {
  AdminCitiesPage,
  AdminDashboard,
  AdminDocsPage,
  AdminLayout,
  AdminLoginPage,
  AdminNoticesPage,
  AdminRegisterPage,
  AdminSystemPage,
  AdminUsersPage,
} from '@/ui/admin';
import { PlanPage } from '@/ui/plan';
import { ScreenPage } from '@/ui/screen';

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
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'notices', element: <AdminNoticesPage /> },
      { path: 'cities', element: <AdminCitiesPage /> },
      { path: 'system', element: <AdminSystemPage /> },
      { path: 'docs', element: <AdminDocsPage /> },
    ],
  },
]);
