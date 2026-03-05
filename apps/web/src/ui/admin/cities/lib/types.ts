import type { CityItem } from '@air-monitor/shared';

export const CITY_TABLE_PAGE_SIZE = 10;

export type CityRow = {
  country: string;
  city: string;
  region: string;
  coordinates: string;
  cityId: string;
};

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function formatRegion(city: CityItem): string {
  if (city.adm2 && city.adm2 !== city.name) {
    return `${city.adm1} / ${city.adm2}`;
  }
  return city.adm1;
}
