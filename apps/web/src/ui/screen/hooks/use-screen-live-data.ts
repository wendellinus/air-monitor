import React from 'react';
import type {
  AirHourlyItem,
  AirNowItem,
  CityItem,
  NoticeItem,
  WeatherAlertResponse,
} from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import {
  REFRESH_AIR_MS,
  REFRESH_ALERTS_MS,
  REFRESH_NOTICES_MS,
  REFRESH_TOP_CITIES_MS,
  humanizeError,
  toastErrorDeduped,
} from '@/ui/screen/lib/screen-utils';

type ScreenLiveDataState = {
  cities: CityItem[];
  notices: NoticeItem[];
  air: AirNowItem | null;
  airHourly: AirHourlyItem[];
  alerts: WeatherAlertResponse | null;
};

type ScreenLiveDataOptions = {
  selected: CityItem | null;
  setSelected: React.Dispatch<React.SetStateAction<CityItem | null>>;
};

export function useScreenLiveData(options: ScreenLiveDataOptions): ScreenLiveDataState {
  const { selected, setSelected } = options;
  const [cities, setCities] = React.useState<CityItem[]>([]);
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [air, setAir] = React.useState<AirNowItem | null>(null);
  const [airHourly, setAirHourly] = React.useState<AirHourlyItem[]>([]);
  const [alerts, setAlerts] = React.useState<WeatherAlertResponse | null>(null);
  const selectedRef = React.useRef<CityItem | null>(selected);

  React.useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  React.useEffect(() => {
    const cityId = selected?.cityId;
    if (!cityId) {
      setAlerts(null);
      return;
    }

    let mounted = true;
    let inFlight: AbortController | null = null;
    let timer: number | null = null;

    const load = async (): Promise<void> => {
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      try {
        const res = await api.get<ApiResponse<WeatherAlertResponse>>('/alert/current', {
          params: { city_id: cityId },
          signal: controller.signal,
        });
        if (!mounted) return;
        setAlerts(res.data.data);
      } catch (e) {
        const err = e as { name?: string; code?: string };
        if (
          err.name === 'CanceledError' ||
          err.name === 'AbortError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }
        if (!mounted) return;
        setAlerts(null);
      }
    };

    void load();
    timer = window.setInterval(() => void load(), REFRESH_ALERTS_MS);
    return () => {
      mounted = false;
      if (timer !== null) window.clearInterval(timer);
      inFlight?.abort();
    };
  }, [selected?.cityId]);

  React.useEffect(() => {
    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attemptCount = 0;

    const loadTopCities = async (): Promise<void> => {
      attemptCount++;
      try {
        const res = await api.get<ApiResponse<CityItem[]>>('/city/top', {
          params: { rangeType: 'cn', number: 10 },
        });
        if (!mounted) return;
        setCities(res.data.data);
        if (!selectedRef.current) setSelected(res.data.data[0] ?? null);
      } catch (e) {
        if (!mounted) return;
        const msg = humanizeError(e);
        if (attemptCount === 1 || attemptCount >= 15) {
          toastErrorDeduped('city-top', msg, 6000);
        }
        if (attemptCount < 15) {
          retryTimer = setTimeout(() => {
            void loadTopCities();
          }, 1200);
        }
      }
    };

    (async () => {
      await loadTopCities();
      try {
        const res = await api.get<ApiResponse<NoticeItem[]>>('/notice/active');
        if (!mounted) return;
        setNotices(res.data.data);
      } catch {
        // ignore on screen
      }
    })();

    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [setSelected]);

  React.useEffect(() => {
    let mounted = true;

    const refreshTopCities = async (): Promise<void> => {
      try {
        const res = await api.get<ApiResponse<CityItem[]>>('/city/top', {
          params: { rangeType: 'cn', number: 10 },
        });
        if (!mounted) return;
        setCities(res.data.data);
      } catch (e) {
        if (!mounted) return;
        toastErrorDeduped('city-top-poll', humanizeError(e), 8000);
      }
    };

    const refreshNotices = async (): Promise<void> => {
      try {
        const res = await api.get<ApiResponse<NoticeItem[]>>('/notice/active');
        if (!mounted) return;
        setNotices(res.data.data);
      } catch {
        // ignore on screen
      }
    };

    const timer1 = window.setInterval(() => void refreshTopCities(), REFRESH_TOP_CITIES_MS);
    const timer2 = window.setInterval(() => void refreshNotices(), REFRESH_NOTICES_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer1);
      window.clearInterval(timer2);
    };
  }, []);

  React.useEffect(() => {
    if (!selected) return;
    setAir(null);
    setAirHourly([]);

    let mounted = true;
    let inFlight: AbortController | null = null;
    let timer: number | null = null;

    const load = async (): Promise<void> => {
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      try {
        const [nowRes, hourlyRes] = await Promise.all([
          api.get<ApiResponse<AirNowItem>>('/air/now', {
            params: { city_id: selected.cityId },
            signal: controller.signal,
          }),
          api.get<ApiResponse<AirHourlyItem[]>>('/air/hourly', {
            params: { city_id: selected.cityId },
            signal: controller.signal,
          }),
        ]);
        if (!mounted) return;
        setAir(nowRes.data.data);
        setAirHourly(Array.isArray(hourlyRes.data.data) ? hourlyRes.data.data : []);
      } catch (e) {
        const err = e as { name?: string; code?: string };
        if (
          err.name === 'CanceledError' ||
          err.name === 'AbortError' ||
          err.code === 'ERR_CANCELED'
        ) {
          return;
        }
        if (!mounted) return;
        toastErrorDeduped(`air-${selected.cityId}`, humanizeError(e), 8000);
      }
    };

    void load();
    timer = window.setInterval(() => void load(), REFRESH_AIR_MS);
    return () => {
      mounted = false;
      if (timer !== null) window.clearInterval(timer);
      inFlight?.abort();
    };
  }, [selected]);

  return {
    cities,
    notices,
    air,
    airHourly,
    alerts,
  };
}
