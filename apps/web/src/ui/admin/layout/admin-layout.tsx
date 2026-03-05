import React from 'react';
import { Outlet } from 'react-router-dom';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

import { AppSidebar } from './app-sidebar';
import { AdminAccessProvider } from './access-context';
import { SiteHeader } from './site-header';
import { useAdminSession } from './use-admin-session';

export function AdminLayout(): React.ReactNode {
  const { me, permissionKeys, handleLogout } = useAdminSession();

  // Apply global admin light theme so Radix portals inherit correct vars
  React.useEffect(() => {
    document.documentElement.classList.add('admin-page');
    return () => document.documentElement.classList.remove('admin-page');
  }, []);

  return (
    <SidebarProvider className="h-svh max-h-svh overflow-hidden">
      <AdminAccessProvider permissionKeys={permissionKeys}>
        <AppSidebar user={me} onLogout={handleLogout} />

        <SidebarInset className="h-full max-h-svh overflow-hidden">
          <SiteHeader />
          <main className="admin-enter flex min-h-0 flex-1 overflow-hidden p-4 md:p-8 lg:p-10">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden pr-1">
                <div
                  className="h-full min-h-0 overflow-auto [scrollbar-gutter:stable]"
                  data-admin-outlet-viewport
                >
                  <Outlet />
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </AdminAccessProvider>
    </SidebarProvider>
  );
}
