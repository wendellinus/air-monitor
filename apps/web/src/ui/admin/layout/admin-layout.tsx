import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { MeResponseData } from '@air-monitor/shared';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { api } from '@/shared/api';
import { clearTokens } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';

import { AppSidebar } from './app-sidebar';
import { SiteHeader } from './site-header';

export function AdminLayout(): React.ReactNode {
  const nav = useNavigate();
  const { t } = useI18n();
  const [me, setMe] = React.useState<MeResponseData | null>(null);

  // Apply global admin light theme so Radix portals inherit correct vars
  React.useEffect(() => {
    document.documentElement.classList.add('admin-page');
    return () => document.documentElement.classList.remove('admin-page');
  }, []);

  React.useEffect(() => {
    let mounted = true;
    api
      .get<ApiResponse<MeResponseData>>('/user/me')
      .then((res) => {
        if (mounted) setMe(res.data.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  function handleLogout() {
    const doLogout = async () => {
      try {
        await api.post('/logout');
      } catch {
        /* noop */
      }
      clearTokens();
      nav('/admin/login', { replace: true });
      toast.success(t('admin.toast.logoutSuccess'));
    };
    void doLogout().catch(() => toast.error(t('admin.toast.logoutFail')));
  }

  return (
    <SidebarProvider>
      <AppSidebar user={me} onLogout={handleLogout} />

      <SidebarInset>
        <SiteHeader />
        <main className="admin-enter flex-1 overflow-auto p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl w-full h-full">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
