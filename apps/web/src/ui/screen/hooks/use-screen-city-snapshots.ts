import React from 'react';
import type { AirNowItem, CityItem, WeatherAlertResponse } from '@air-monitor/shared';

import { api } from '@/shared/api';
import { SILENT_UI_ERROR_REQUEST_CONFIG } from '@/shared/http/api-request-config';
import type { ApiResponse } from '@/shared/types';

export type ScreenCitySnapshot = {
  air: AirNowItem | null;
  alerts: WeatherAlertResponse | null;
};

type ScreenCitySnapshots = Record<string, ScreenCitySnapshot>;

type UseScreenCitySnapshotsOptions = {
  cities: CityItem[];
  pollingIntervalMs: number;
};

export function useScreenCitySnapshots(options: UseScreenCitySnapshotsOptions): ScreenCitySnapshots {
  const { cities, pollingIntervalMs } = options;
  const [snapshots, setSnapshots] = React.useState<ScreenCitySnapshots>({});

  React.useEffect(() => {
    if (cities.length === 0) {
      setSnapshots({});
      return;
    }

    let mounted = true;
    let timer: number | null = null;

    const loadSnapshots = async (): Promise<void> => {
      const entries = await Promise.all(
        cities.map(async (city): Promise<[string, ScreenCitySnapshot]> => {
          let air: AirNowItem | null = null;
          let alerts: WeatherAlertResponse | null = null;

          try {
            const airResponse = await api.get<ApiResponse<AirNowItem>>('/air/now', {
              ...SILENT_UI_ERROR_REQUEST_CONFIG,
              params: { city_id: city.cityId },
            });
            air = airResponse.data.data;
          } catch {
            air = null;
          }

          try {
            const alertsResponse = await api.get<ApiResponse<WeatherAlertResponse>>('/alert/current', {
              ...SILENT_UI_ERROR_REQUEST_CONFIG,
              params: { city_id: city.cityId },
            });
            alerts = alertsResponse.data.data;
          } catch {
            alerts = null;
          }

          return [
            city.cityId,
            {
              air,
              alerts,
            },
          ];
        }),
      );

      if (!mounted) return;
      setSnapshots(Object.fromEntries(entries));
    };

    void loadSnapshots();
    timer = window.setInterval(() => {
      void loadSnapshots();
    }, pollingIntervalMs);

    return () => {
      mounted = false;
      if (timer !== null) window.clearInterval(timer);
    };
  }, [cities, pollingIntervalMs]);

  return snapshots;
}
