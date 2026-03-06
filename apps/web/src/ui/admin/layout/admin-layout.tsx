import React from 'react';
import { Monitor } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { AdminAccessProvider } from './access-context';
import { AppSidebar } from './app-sidebar';
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
              <div className="min-h-0 flex-1 overflow-hidden pr-1">
                <div
                  className="h-full min-h-0 overflow-auto [scrollbar-gutter:stable]"
                  data-admin-outlet-viewport
                >
                  <Outlet />
                </div>
              </div>
            </div>
          </main>

          <div className="pointer-events-none fixed bottom-6 right-6 z-40">
            <Button
              asChild
              size="icon"
              className="pointer-events-auto h-12 w-12 rounded-full shadow-lg ring-1 ring-primary/30"
            >
              <Link to="/screen" title={'\u524d\u5f80\u5927\u5c4f'} aria-label={'\u524d\u5f80\u5927\u5c4f'}>
                <Monitor className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </SidebarInset>
      </AdminAccessProvider>
    </SidebarProvider>
  );
}
