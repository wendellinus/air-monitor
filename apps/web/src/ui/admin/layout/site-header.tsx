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

import { LanguageSwitcher } from './language-switcher';

const BREADCRUMB_KEYS: Record<string, MessageKey> = {
  '/admin': 'admin.nav.dashboard',
  '/admin/users': 'admin.nav.users',
  '/admin/notices': 'admin.nav.notices',
  '/admin/cities': 'admin.nav.cities',
  '/admin/system': 'admin.nav.system',
  '/admin/docs': 'admin.nav.docs',
};

export function SiteHeader(): React.ReactNode {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const isRoot = pathname === '/admin';
  const pageKey = BREADCRUMB_KEYS[pathname];
  const pageLabel = pageKey ? t(pageKey) : null;

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="ml-0 shrink-0" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
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

      <div className="shrink-0">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
