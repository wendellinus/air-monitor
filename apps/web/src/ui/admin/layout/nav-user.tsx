import React from 'react';
import type { MeResponseData } from '@air-monitor/shared';
import { ChevronsUpDown, Languages, LogOut, Sparkles, UserRoundCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useI18n } from '@/shared/i18n';
import { ADMIN_TOUR_START_EVENT } from '@/ui/admin/components/admin-driver-tour-button';

import { isLocale, LOCALES, useLocaleSwitcher } from './language-switcher';

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

interface NavUserProps {
  user: MeResponseData | null;
  onLogout: () => void;
}

function getRoleBadge(
  t: (key: string) => string,
  role: MeResponseData['role'] | undefined,
): React.ReactNode {
  if (role === 'admin') {
    return (
      <Badge variant="default" className="inline-flex h-6 w-fit shrink-0 rounded-full px-2.5 text-xs font-semibold tracking-normal">
        {t('admin.users.role.admin')}
      </Badge>
    );
  }

  if (role === 'operator') {
    return (
      <Badge variant="secondary" className="inline-flex h-6 w-fit shrink-0 rounded-full px-2.5 text-xs font-semibold tracking-normal">
        {t('admin.users.role.operator')}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="inline-flex h-6 w-fit shrink-0 rounded-full px-2.5 text-xs font-semibold tracking-normal">
      {t('admin.users.role.user')}
    </Badge>
  );
}

export function NavUser({ user, onLogout }: NavUserProps): React.ReactNode {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { locale: currentLocale, saving, changeLocale, getLocaleLabel } = useLocaleSwitcher();
  const avatarChar = (user?.username?.[0] ?? '?').toUpperCase();
  const username = user?.username ?? '-';

  const handleStartTour = React.useCallback((): void => {
    window.dispatchEvent(new Event(ADMIN_TOUR_START_EVENT));
  }, []);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user?.username ?? t('admin.user.default')}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                {avatarChar}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm leading-tight">
                <span className="truncate font-medium">{username}</span>
                {getRoleBadge(t, user?.role)}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="top"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                  {avatarChar}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{username}</span>
                  {getRoleBadge(t, user?.role)}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <Languages className="size-4 text-muted-foreground" />
                {t('admin.user.language')}
                <DropdownMenuShortcut className="tracking-normal opacity-70">
                  {getLocaleLabel(currentLocale)}
                </DropdownMenuShortcut>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-40">
                <DropdownMenuRadioGroup
                  value={currentLocale}
                  onValueChange={(value) => {
                    if (!isLocale(value)) return;
                    void changeLocale(value);
                  }}
                >
                  {LOCALES.map((value) => (
                    <DropdownMenuRadioItem
                      key={value}
                      value={value}
                      disabled={saving}
                      className="cursor-pointer"
                    >
                      {getLocaleLabel(value)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleStartTour}
            >
              <Sparkles className="size-4 text-blue-600" />
              {textByLocale(locale, '新手引导', 'Tour')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate('/admin/profile-settings')}
            >
              <UserRoundCog className="size-4" />
              {textByLocale(locale, '账户设置', 'Account settings')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-muted-foreground hover:text-destructive focus:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="size-4" />
              {t('admin.user.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
