import React from 'react';
import { toast } from 'sonner';
import type { CityItem } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import { humanizeError, toastErrorDeduped } from '@/ui/screen/lib/screen-utils';

type ScreenFavoritesState = {
  favoriteCities: CityItem[];
  favoriteCitySet: Set<string>;
  favoritesLoading: boolean;
  favoriteSubmittingCityId: string | null;
  toggleFavorite: (city: CityItem) => Promise<void>;
};

type ScreenFavoritesOptions = {
  canManageFavorites: boolean;
  selectedCityId?: string;
  favoritesOpen: boolean;
  setFavoritesOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useScreenFavorites(options: ScreenFavoritesOptions): ScreenFavoritesState {
  const { canManageFavorites, selectedCityId, favoritesOpen, setFavoritesOpen } = options;
  const [favoriteCities, setFavoriteCities] = React.useState<CityItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = React.useState<boolean>(false);
  const [favoriteSubmittingCityId, setFavoriteSubmittingCityId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!canManageFavorites) {
      setFavoriteCities([]);
      return;
    }

    let mounted = true;
    setFavoritesLoading(true);
    api
      .get<ApiResponse<CityItem[]>>('/user/favorites/cities')
      .then((res) => {
        if (!mounted) return;
        setFavoriteCities(Array.isArray(res.data.data) ? res.data.data : []);
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        const msg = humanizeError(error);
        toastErrorDeduped('favorite-load', msg, 3000);
      })
      .finally(() => {
        if (!mounted) return;
        setFavoritesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [canManageFavorites]);

  const favoriteCitySet = React.useMemo(
    () => new Set(favoriteCities.map((city) => city.cityId)),
    [favoriteCities],
  );

  const toggleFavorite = React.useCallback(
    async (city: CityItem): Promise<void> => {
      if (!canManageFavorites) {
        toast.info('请先登录后台账号，再使用收藏功能。');
        return;
      }
      if (favoriteSubmittingCityId) return;

      const isFavorite = favoriteCitySet.has(city.cityId);
      setFavoriteSubmittingCityId(city.cityId);
      try {
        if (isFavorite) {
          await api.delete(`/user/favorites/cities/${city.cityId}`);
          setFavoriteCities((current) => current.filter((item) => item.cityId !== city.cityId));
          if (favoritesOpen && selectedCityId === city.cityId) {
            setFavoritesOpen(false);
          }
          return;
        }

        await api.post('/user/favorites/cities', city);
        setFavoriteCities((current) => {
          const exists = current.some((item) => item.cityId === city.cityId);
          if (exists) return current;
          return [city, ...current].slice(0, 30);
        });
      } catch (error: unknown) {
        const msg = humanizeError(error);
        toastErrorDeduped('favorite-save', msg, 2500);
      } finally {
        setFavoriteSubmittingCityId(null);
      }
    },
    [
      canManageFavorites,
      favoriteCitySet,
      favoriteSubmittingCityId,
      favoritesOpen,
      selectedCityId,
      setFavoritesOpen,
    ],
  );

  return {
    favoriteCities,
    favoriteCitySet,
    favoritesLoading,
    favoriteSubmittingCityId,
    toggleFavorite,
  };
}
