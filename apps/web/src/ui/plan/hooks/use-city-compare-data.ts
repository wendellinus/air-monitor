import React from 'react';
import type { AirHourlyItem, AirNowItem, CityItem, WeatherAlertResponse } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import { humanizeError } from '@/ui/screen/lib/screen-utils';

export type CompareCityDataset = {
  city: CityItem;
  airNow: AirNowItem | null;
  hourly: AirHourlyItem[];
  alerts: WeatherAlertResponse | null;
  loading: boolean;
};

type CompareDataState = {
  cityOptions: CityItem[];
  selectedCityIds: string[];
  selectedDatasets: CompareCityDataset[];
  focusedCityId: string | null;
  loadingCities: boolean;
  loadingDatasets: boolean;
  error: string | null;
  toggleCitySelection: (cityId: string) => void;
  setFocusedCityId: (cityId: string) => void;
};

const DEFAULT_CITY_COUNT = 8;
const DEFAULT_SELECTED_COUNT = 3;
const MAX_SELECTED_COUNT = 4;
const MIN_SELECTED_COUNT = 2;

export function useCityCompareData(): CompareDataState {
  const [cityOptions, setCityOptions] = React.useState<CityItem[]>([]);
  const [selectedCityIds, setSelectedCityIds] = React.useState<string[]>([]);
  const [datasets, setDatasets] = React.useState<Record<string, CompareCityDataset>>({});
  const [focusedCityId, setFocusedCityId] = React.useState<string | null>(null);
  const [loadingCities, setLoadingCities] = React.useState<boolean>(true);
  const [loadingDatasets, setLoadingDatasets] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadCityOptions = async (): Promise<void> => {
      setLoadingCities(true);
      try {
        const response = await api.get<ApiResponse<CityItem[]>>('/city/top', {
          params: { rangeType: 'cn', number: DEFAULT_CITY_COUNT },
        });
        if (!mounted) return;
        const nextCities = Array.isArray(response.data.data) ? response.data.data : [];
        setCityOptions(nextCities);
        const nextSelected = nextCities.slice(0, DEFAULT_SELECTED_COUNT).map((city) => city.cityId);
        setSelectedCityIds(nextSelected);
        setFocusedCityId(nextSelected[0] ?? null);
        setError(null);
      } catch (errorValue: unknown) {
        if (!mounted) return;
        setError(humanizeError(errorValue));
      } finally {
        if (mounted) setLoadingCities(false);
      }
    };

    void loadCityOptions();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (selectedCityIds.length === 0 || cityOptions.length === 0) return;
    let mounted = true;

    const selectedCities = selectedCityIds
      .map((cityId) => cityOptions.find((item) => item.cityId === cityId) ?? null)
      .filter((item): item is CityItem => item !== null);

    const loadDatasets = async (): Promise<void> => {
      setLoadingDatasets(true);
      try {
        const nextEntries = await Promise.all(
          selectedCities.map(async (city): Promise<[string, CompareCityDataset]> => {
            const [airNowRes, hourlyRes, alertsRes] = await Promise.allSettled([
              api.get<ApiResponse<AirNowItem>>('/air/now', { params: { city_id: city.cityId } }),
              api.get<ApiResponse<AirHourlyItem[]>>('/air/hourly', { params: { city_id: city.cityId } }),
              api.get<ApiResponse<WeatherAlertResponse>>('/alert/current', {
                params: { city_id: city.cityId },
              }),
            ]);

            return [
              city.cityId,
              {
                city,
                airNow: airNowRes.status === 'fulfilled' ? airNowRes.value.data.data : null,
                hourly:
                  hourlyRes.status === 'fulfilled' && Array.isArray(hourlyRes.value.data.data)
                    ? hourlyRes.value.data.data
                    : [],
                alerts: alertsRes.status === 'fulfilled' ? alertsRes.value.data.data : null,
                loading: false,
              },
            ];
          }),
        );

        if (!mounted) return;
        setDatasets(Object.fromEntries(nextEntries));
      } catch (errorValue: unknown) {
        if (!mounted) return;
        setError(humanizeError(errorValue));
      } finally {
        if (mounted) setLoadingDatasets(false);
      }
    };

    void loadDatasets();
    return () => {
      mounted = false;
    };
  }, [cityOptions, selectedCityIds]);

  const toggleCitySelection = React.useCallback((cityId: string): void => {
    setSelectedCityIds((current) => {
      if (current.includes(cityId)) {
        if (current.length <= MIN_SELECTED_COUNT) return current;
        const next = current.filter((item) => item !== cityId);
        setFocusedCityId((focused) => (focused === cityId ? next[0] ?? null : focused));
        return next;
      }

      if (current.length >= MAX_SELECTED_COUNT) return current;
      const next = [...current, cityId];
      setFocusedCityId((focused) => focused ?? cityId);
      return next;
    });
  }, []);

  const selectedDatasets = React.useMemo(
    () =>
      selectedCityIds
        .map((cityId) => datasets[cityId] ?? null)
        .filter((item): item is CompareCityDataset => item !== null),
    [datasets, selectedCityIds],
  );

  return {
    cityOptions,
    selectedCityIds,
    selectedDatasets,
    focusedCityId,
    loadingCities,
    loadingDatasets,
    error,
    toggleCitySelection,
    setFocusedCityId,
  };
}
