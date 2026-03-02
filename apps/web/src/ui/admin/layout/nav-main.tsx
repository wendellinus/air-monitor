import React from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  MapPin,
  Settings,
  type LucideIcon,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages';

const NAV_ITEMS: Array<{
  to: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  end: boolean;
}> = [
  { to: '/admin', labelKey: 'admin.nav.dashboard', icon: BarChart3, end: true },
  { to: '/admin/users', labelKey: 'admin.nav.users', icon: Users, end: false },
  { to: '/admin/notices', labelKey: 'admin.nav.notices', icon: Bell, end: false },
  { to: '/admin/cities', labelKey: 'admin.nav.cities', icon: MapPin, end: false },
  { to: '/admin/system', labelKey: 'admin.nav.system', icon: Settings, end: false },
  { to: '/admin/docs', labelKey: 'admin.nav.docs', icon: BookOpen, end: false },
];

export function NavMain(): React.ReactNode {
  const { t } = useI18n();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('admin.nav.group')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon, end }) => {
            const label = t(labelKey);
            return (
              <SidebarMenuItem key={to}>
                <NavLink to={to} end={end} className="w-full">
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive} tooltip={label}>
                      <Icon className="size-4" strokeWidth={1.75} />
                      <span>{label}</span>
                      {isActive ? (
                        <ChevronRight className="ml-auto size-3.5 opacity-50" strokeWidth={2} />
                      ) : null}
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
