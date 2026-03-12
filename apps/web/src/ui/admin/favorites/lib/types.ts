export type FavoriteMode = 'admin' | 'self';

export type FavoriteItem = {
  userId: number;
  username: string;
  cityId: string;
  cityName: string;
  adm1: string;
  adm2: string;
  country: string;
  createdAt: string | null;
};

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const FAVORITES_PAGE_SIZE = 15;
