import type { AdminFavoriteCityListData } from '@air-monitor/shared';

export type FavoriteItem = AdminFavoriteCityListData['list'][number];
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const FAVORITES_PAGE_SIZE = 15;
