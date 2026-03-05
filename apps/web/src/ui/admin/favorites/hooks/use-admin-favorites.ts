import React from 'react';
import { toast } from 'sonner';
import type { AdminFavoriteCityListData } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  FAVORITES_PAGE_SIZE,
  type FavoriteItem,
  type TranslateFn,
} from '@/ui/admin/favorites/lib/types';

type UseAdminFavoritesInput = {
  t: TranslateFn;
};

type UseAdminFavoritesResult = {
  pageSize: number;
  items: FavoriteItem[];
  total: number;
  totalPages: number;
  page: number;
  keyword: string;
  inputValue: string;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  removingKey: string | null;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
  clearSearch: () => void;
  refresh: () => Promise<void>;
  removeFavorite: (item: FavoriteItem) => Promise<void>;
};

export function useAdminFavorites(input: UseAdminFavoritesInput): UseAdminFavoritesResult {
  const { t } = input;
  const [items, setItems] = React.useState<FavoriteItem[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [isInitialLoading, setIsInitialLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(1);
  const [keyword, setKeyword] = React.useState<string>('');
  const [inputValue, setInputValue] = React.useState<string>('');
  const [removingKey, setRemovingKey] = React.useState<string | null>(null);
  const firstLoadRef = React.useRef<boolean>(true);

  const totalPages = React.useMemo(() => Math.max(1, Math.ceil(total / FAVORITES_PAGE_SIZE)), [total]);

  const loadData = React.useCallback(
    async (
      targetPage: number,
      kw: string,
      mode: 'initial' | 'refresh' = 'refresh',
    ): Promise<void> => {
      if (mode === 'initial') {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const response = await api.get<ApiResponse<AdminFavoriteCityListData>>(
          '/admin/users/favorites/cities',
          {
            params: {
              page: targetPage,
              pageSize: FAVORITES_PAGE_SIZE,
              keyword: kw.trim() || undefined,
            },
          },
        );
        setItems(response.data.data.list);
        setTotal(response.data.data.total);
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : t('admin.favorites.loadFail'));
      } finally {
        if (mode === 'initial') {
          setIsInitialLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [t],
  );

  React.useEffect(() => {
    const mode = firstLoadRef.current ? 'initial' : 'refresh';
    firstLoadRef.current = false;
    void loadData(page, keyword, mode);
  }, [keyword, loadData, page]);

  const handleSearch = React.useCallback((): void => {
    setPage(1);
    setKeyword(inputValue.trim());
  }, [inputValue]);

  const clearSearch = React.useCallback((): void => {
    setKeyword('');
    setInputValue('');
    setPage(1);
  }, []);

  const refresh = React.useCallback(async (): Promise<void> => {
    await loadData(page, keyword, 'refresh');
  }, [keyword, loadData, page]);

  const removeFavorite = React.useCallback(
    async (item: FavoriteItem): Promise<void> => {
      const opKey = `${item.userId}:${item.cityId}`;
      setRemovingKey(opKey);
      try {
        await api.delete(`/admin/users/favorites/cities/${item.userId}/${item.cityId}`);
        toast.success(
          t('admin.favorites.removeSuccess', {
            username: item.username,
            city: item.cityName,
          }),
        );
        setItems((current) =>
          current.filter((row) => !(row.userId === item.userId && row.cityId === item.cityId)),
        );
        setTotal((current) => Math.max(0, current - 1));
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : t('admin.favorites.removeFail'));
      } finally {
        setRemovingKey(null);
      }
    },
    [t],
  );

  return {
    pageSize: FAVORITES_PAGE_SIZE,
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
  };
}
