import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { getAccessToken } from './auth';
import {
  AdminCitiesPage,
  AdminDashboard,
  AdminFavoritesPage,
  AdminLayout,
  AdminLoginPage,
  AdminNoticesPage,
  AdminPermissionsPage,
  AdminProfileSettingsPage,
  AdminRegisterPage,
  AdminSystemPage,
  AdminUsersPage,
} from '@/ui/admin';
import { NotFoundPage } from '@/ui/not-found-page';
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
      { path: 'favorites', element: <AdminFavoritesPage /> },
      { path: 'system', element: <AdminSystemPage /> },
      { path: 'permissions', element: <AdminPermissionsPage /> },
      { path: 'api-quota', element: <Navigate to="/admin/system?tab=qweather" replace /> },
      { path: 'profile-settings', element: <AdminProfileSettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
