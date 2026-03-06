import React from 'react';
import { Star } from 'lucide-react';

import { useRateLimitedAction } from '@/hooks/use-rate-limited-action';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { PageShell } from '@/ui/admin/components/page-shell';
import { useAdminAccess } from '@/ui/admin/layout/access-context';
import {
  FavoritesPagination,
  FavoritesTableCard,
  FavoritesToolbar,
} from '@/ui/admin/favorites/components';
import { useAdminFavorites } from '@/ui/admin/favorites/hooks';
import { useI18n } from '@/shared/i18n';

export function AdminFavoritesPage(): React.ReactNode {
  const { locale, t } = useI18n();
  const { hasPermission } = useAdminAccess();
  const {
    items,
    total,
    totalPages,
    page,
    keyword,
    inputValue,
    isInitialLoading,
    isRefreshing,
    removingKey,
    setPage,
    setInputValue,
    handleSearch,
    clearSearch,
    refresh,
    removeFavorite,
  } = useAdminFavorites({ t });
  const refreshAction = useRateLimitedAction(() => refresh(), { cooldownMs: 800 });

  if (!hasPermission('favorites.view')) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Star />
        </EmptyMedia>
        <EmptyTitle>{t('admin.access.deniedTitle')}</EmptyTitle>
        <EmptyDescription>{t('admin.access.deniedDesc')}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <PageShell
      title={t('admin.favorites.title')}
      description={t('admin.favorites.desc')}
      fitHeight
      bodyClassName="min-h-0"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <FavoritesToolbar
          t={t}
          inputValue={inputValue}
          keyword={keyword}
          isRefreshing={isRefreshing}
          isInitialLoading={isInitialLoading}
          refreshLocked={refreshAction.locked}
          onInputChange={setInputValue}
          onSearch={handleSearch}
          onClear={clearSearch}
          onRefresh={refreshAction.run}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          <FavoritesTableCard
            t={t}
            locale={locale}
            isInitialLoading={isInitialLoading}
            items={items}
            removingKey={removingKey}
            className="h-full"
            onRemove={(item) => void removeFavorite(item)}
          />
        </div>

        <div className="shrink-0">
          <FavoritesPagination
            t={t}
            page={page}
            totalPages={totalPages}
            isRefreshing={isRefreshing}
            onPrevPage={() => setPage((current) => current - 1)}
            onNextPage={() => setPage((current) => current + 1)}
          />
        </div>
      </div>
    </PageShell>
  );
}
