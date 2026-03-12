import React from 'react';
import {
  BarChart3,
  Bell,
  ChevronRight,
  MapPin,
  Settings,
  ShieldCheck,
  Star,
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages';

import { useAdminAccess } from './access-context';

const NAV_ITEMS: Array<{
  to: string;
  labelKey: MessageKey;
  permissionKey: string;
  icon: LucideIcon;
  end: boolean;
}> = [
  { to: '/admin', labelKey: 'admin.nav.dashboard', permissionKey: 'dashboard.view', icon: BarChart3, end: true },
  { to: '/admin/users', labelKey: 'admin.nav.users', permissionKey: 'users.view', icon: Users, end: false },
  { to: '/admin/notices', labelKey: 'admin.nav.notices', permissionKey: 'notices.view', icon: Bell, end: false },
  { to: '/admin/cities', labelKey: 'admin.nav.cities', permissionKey: 'cities.view', icon: MapPin, end: false },
  { to: '/admin/favorites', labelKey: 'admin.nav.favorites', permissionKey: 'favorites.view', icon: Star, end: false },
  { to: '/admin/system', labelKey: 'admin.nav.system', permissionKey: 'system.view', icon: Settings, end: false },
  {
    to: '/admin/permissions',
    labelKey: 'admin.nav.permissions',
    permissionKey: 'permissions.view',
    icon: ShieldCheck,
    end: false,
  },
];

const NAV_TOUR_ID_MAP: Record<string, string> = {
  '/admin': 'nav-dashboard',
  '/admin/users': 'nav-users',
  '/admin/notices': 'nav-notices',
  '/admin/cities': 'nav-cities',
  '/admin/favorites': 'nav-favorites',
  '/admin/system': 'nav-system',
  '/admin/permissions': 'nav-permissions',
};

function middleEllipsis(value: string, maxLength = 14): string {
  if (value.length <= maxLength) return value;
  if (maxLength <= 7) return `${value.slice(0, maxLength - 3)}...`;

  const leftLength = Math.floor((maxLength - 3) / 2);
  const rightLength = maxLength - 3 - leftLength;
  return `${value.slice(0, leftLength)}...${value.slice(value.length - rightLength)}`;
}

export function NavMain(): React.ReactNode {
  const { t } = useI18n();
  const { state } = useSidebar();
  const { canAccessPath } = useAdminAccess();
  const visibleItems = React.useMemo(
    () => NAV_ITEMS.filter((item) => canAccessPath(item.to)),
    [canAccessPath],
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('admin.nav.group')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map(({ to, labelKey, icon: Icon, end }) => {
            const label = t(labelKey);
            const shortLabel = middleEllipsis(label, 12);
            const showFullLabelTooltip = state !== 'collapsed' && shortLabel !== label;
            return (
              <SidebarMenuItem key={to}>
                <NavLink to={to} end={end} className="w-full">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={state === 'collapsed' ? label : undefined}
                      data-tour={NAV_TOUR_ID_MAP[to]}
                    >
                      <Icon className="size-4" strokeWidth={1.75} />
                      {showFullLabelTooltip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block min-w-0 flex-1">{shortLabel}</span>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            {label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="block min-w-0 flex-1">{shortLabel}</span>
                      )}
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
