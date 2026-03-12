import React from 'react';
import { Home } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useI18n } from '@/shared/i18n';
import type { MessageKey } from '@/shared/i18n/messages';

import { AdminHeaderSearch } from './admin-header-search';

const BREADCRUMB_KEYS: Record<string, MessageKey> = {
  '/admin': 'admin.nav.dashboard',
  '/admin/users': 'admin.nav.users',
  '/admin/notices': 'admin.nav.notices',
  '/admin/cities': 'admin.nav.cities',
  '/admin/favorites': 'admin.nav.favorites',
  '/admin/system': 'admin.nav.system',
  '/admin/permissions': 'admin.nav.permissions',
};

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

export function SiteHeader(): React.ReactNode {
  const { pathname } = useLocation();
  const { t, locale } = useI18n();

  const isRoot = pathname === '/admin';
  const isUserDetail = /^\/admin\/users\/\d+$/.test(pathname);
  const pageKey = BREADCRUMB_KEYS[pathname];
  const pageLabel =
    pathname === '/admin/profile-settings'
      ? textByLocale(locale, '账户设置', 'Account Settings')
      : isUserDetail
        ? t('admin.users.detail.title')
      : (pageKey ? t(pageKey) : null);

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-[oklch(0.985_0.005_245)] px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="ml-0 shrink-0" data-tour="header-sidebar-toggle" />
        <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href="/admin"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Home className="size-3.5" />
                {t('admin.header.home')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {!isRoot && pageLabel ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto w-full max-w-[30rem]">
        <AdminHeaderSearch />
      </div>
    </header>
  );
}
