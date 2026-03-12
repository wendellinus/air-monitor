import React from 'react';
import { toast } from 'sonner';
import type { AdminFavoriteCityListData, CityItem, MeResponseData } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import { FAVORITES_PAGE_SIZE, type FavoriteItem, type FavoriteMode, type TranslateFn } from '@/ui/admin/favorites/lib/types';

type UseAdminFavoritesInput = {
  t: TranslateFn;
  me: MeResponseData | null;
};

type UseAdminFavoritesResult = {
  mode: FavoriteMode;
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
  supportsSearch: boolean;
  supportsPagination: boolean;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
  clearSearch: () => void;
  refresh: () => Promise<void>;
  removeFavorite: (item: FavoriteItem) => Promise<void>;
};

function toSelfFavoriteItems(list: CityItem[], me: MeResponseData | null): FavoriteItem[] {
  return list.map((item) => ({
    userId: me?.id ?? 0,
    username: me?.username ?? '',
    cityId: item.cityId,
    cityName: item.name,
    adm1: item.adm1,
    adm2: item.adm2,
    country: item.country,
    createdAt: null,
  }));
}

export function useAdminFavorites(input: UseAdminFavoritesInput): UseAdminFavoritesResult {
  const { me, t } = input;
  const mode: FavoriteMode = me?.role === 'admin' || me?.role === 'operator' ? 'admin' : 'self';
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
  const supportsSearch = mode === 'admin';
  const supportsPagination = mode === 'admin';

  const loadData = React.useCallback(
    async (targetPage: number, kw: string, loadingMode: 'initial' | 'refresh' = 'refresh'): Promise<void> => {
      if (loadingMode === 'initial') {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        if (mode === 'admin') {
          const response = await api.get<ApiResponse<AdminFavoriteCityListData>>('/admin/users/favorites/cities', {
            params: {
              page: targetPage,
              pageSize: FAVORITES_PAGE_SIZE,
              keyword: kw.trim() || undefined,
            },
          });
          setItems(
            response.data.data.list.map((item) => ({
              userId: item.userId,
              username: item.username,
              cityId: item.cityId,
              cityName: item.cityName,
              adm1: item.adm1,
              adm2: item.adm2,
              country: item.country,
              createdAt: item.createdAt,
            })),
          );
          setTotal(response.data.data.total);
          return;
        }

        const response = await api.get<ApiResponse<CityItem[]>>('/user/favorites/cities');
        const nextItems = toSelfFavoriteItems(response.data.data, me);
        setItems(nextItems);
        setTotal(nextItems.length);
      } catch (errorValue) {
        toast.error(errorValue instanceof Error ? errorValue.message : t('admin.favorites.loadFail'));
      } finally {
        if (loadingMode === 'initial') {
          setIsInitialLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [me, mode, t],
  );

  React.useEffect(() => {
    const loadingMode = firstLoadRef.current ? 'initial' : 'refresh';
    firstLoadRef.current = false;
    void loadData(page, keyword, loadingMode);
  }, [keyword, loadData, page]);

  React.useEffect(() => {
    if (mode === 'admin') return;
    setPage(1);
    setKeyword('');
    setInputValue('');
  }, [mode]);

  const handleSearch = React.useCallback((): void => {
    if (!supportsSearch) return;
    setPage(1);
    setKeyword(inputValue.trim());
  }, [inputValue, supportsSearch]);

  const clearSearch = React.useCallback((): void => {
    if (!supportsSearch) return;
    setKeyword('');
    setInputValue('');
    setPage(1);
  }, [supportsSearch]);

  const refresh = React.useCallback(async (): Promise<void> => {
    await loadData(page, keyword, 'refresh');
  }, [keyword, loadData, page]);

  const removeFavorite = React.useCallback(
    async (item: FavoriteItem): Promise<void> => {
      const opKey = `${item.userId}:${item.cityId}`;
      setRemovingKey(opKey);
      try {
        if (mode === 'admin') {
          await api.delete(`/admin/users/favorites/cities/${item.userId}/${item.cityId}`);
        } else {
          await api.delete(`/user/favorites/cities/${item.cityId}`);
        }

        toast.success(
          t('admin.favorites.removeSuccess', {
            username: item.username || me?.username || '',
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
    [me?.username, mode, t],
  );

  return {
    mode,
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
    supportsSearch,
    supportsPagination,
    setPage,
    setInputValue,
    handleSearch,
    clearSearch,
    refresh,
    removeFavorite,
  };
}
