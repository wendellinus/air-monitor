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
  AdminUserDetailPage,
  AdminUsersPage,
} from '@/ui/admin';
import { RequireAdminRouteAccess } from '@/ui/admin/layout/admin-route-guard';
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
      {
        index: true,
        element: (
          <RequireAdminRouteAccess path="/admin">
            <AdminDashboard />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'users',
        element: (
          <RequireAdminRouteAccess path="/admin/users">
            <AdminUsersPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <RequireAdminRouteAccess path="/admin/users">
            <AdminUserDetailPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'notices',
        element: (
          <RequireAdminRouteAccess path="/admin/notices">
            <AdminNoticesPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'cities',
        element: (
          <RequireAdminRouteAccess path="/admin/cities">
            <AdminCitiesPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'favorites',
        element: (
          <RequireAdminRouteAccess path="/admin/favorites">
            <AdminFavoritesPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'system',
        element: (
          <RequireAdminRouteAccess path="/admin/system">
            <AdminSystemPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'permissions',
        element: (
          <RequireAdminRouteAccess path="/admin/permissions">
            <AdminPermissionsPage />
          </RequireAdminRouteAccess>
        ),
      },
      {
        path: 'api-quota',
        element: (
          <RequireAdminRouteAccess path="/admin/api-quota">
            <Navigate to="/admin/system?tab=qweather" replace />
          </RequireAdminRouteAccess>
        ),
      },
      { path: 'profile-settings', element: <AdminProfileSettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
