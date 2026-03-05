import React from 'react';
import type { MeResponseData } from '@air-monitor/shared';
import { Leaf } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useI18n } from '@/shared/i18n';
import { useUiShellStore } from '@/ui/admin/stores/ui-shell-store';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

interface AppSidebarProps {
  user: MeResponseData | null;
  onLogout: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps): React.ReactNode {
  const { t } = useI18n();
  const sidebarWidth = useUiShellStore((state) => state.sidebarWidth);
  const sidebarMin = Math.max(232, sidebarWidth - 16);
  const sidebarMax = Math.min(288, sidebarWidth + 16);

  return (
    <Sidebar
      collapsible="icon"
      style={
        {
          '--sidebar-width': `${sidebarWidth}px`,
          '--sidebar-width-min': `${sidebarMin}px`,
          '--sidebar-width-max': `${sidebarMax}px`,
        } as React.CSSProperties
      }
      className="data-[state=expanded]:min-w-[var(--sidebar-width-min)] data-[state=expanded]:max-w-[var(--sidebar-width-max)]"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Leaf className="size-4" strokeWidth={2} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('admin.title')}</span>
                  <span className="truncate text-xs text-muted-foreground">Air Monitor</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  );
}
