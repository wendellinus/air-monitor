import React from 'react';
import { toast } from 'sonner';
import type { CityItem } from '@air-monitor/shared';

import { gcj02ToWgs84, wgs84ToGcj02, type LonLat } from '@/lib/coords';
import { api } from '@/shared/api';
import { ApiError, type ApiResponse } from '@/shared/types';
import { humanizeError, toastErrorDeduped } from '@/ui/screen/lib/screen-utils';

type ScreenLocationState = {
  picked: LonLat | null;
  setPicked: React.Dispatch<React.SetStateAction<LonLat | null>>;
  onMapClick: (gcj: LonLat) => void;
  locateMe: () => void;
};

type ScreenLocationOptions = {
  setSelected: React.Dispatch<React.SetStateAction<CityItem | null>>;
};

export function useScreenLocation(options: ScreenLocationOptions): ScreenLocationState {
  const { setSelected } = options;
  const [picked, setPicked] = React.useState<LonLat | null>(null);
  const mapLookupAbortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => mapLookupAbortRef.current?.abort();
  }, []);

  const onMapClick = React.useCallback(
    (gcj: LonLat): void => {
      const lon = Number(gcj.lon);
      const lat = Number(gcj.lat);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

      const wgs = gcj02ToWgs84(lon, lat);
      const normalized = { lon: Number(wgs.lon.toFixed(8)), lat: Number(wgs.lat.toFixed(8)) };
      if (!Number.isFinite(normalized.lon) || !Number.isFinite(normalized.lat)) return;

      setPicked(normalized);

      mapLookupAbortRef.current?.abort();
      const controller = new AbortController();
      mapLookupAbortRef.current = controller;

      api
        .get<ApiResponse<CityItem[]>>('/city/lookup', {
          params: { lon: normalized.lon, lat: normalized.lat },
          signal: controller.signal,
        })
        .then((res) => {
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          const found = list[0] ?? null;
          if (!found) {
            toast.info('该位置无法识别到有效城市（可能在海面/无人区），请选陆地位置。');
            return;
          }
          setPicked(null);
          setSelected(found);
        })
        .catch((e: unknown) => {
          const err = e as { name?: string; code?: string };
          if (
            err.name === 'CanceledError' ||
            err.name === 'AbortError' ||
            err.code === 'ERR_CANCELED'
          ) {
            return;
          }

          if (e instanceof ApiError && e.code === 50001) {
            const raw = (e.message || '').toLowerCase();
            if (raw.includes('status code 400')) {
              toast.info('该位置无法识别到有效城市（可能在海面/无人区），请选陆地位置。');
              return;
            }
          }

          const msg = humanizeError(e);
          if (msg.includes('海面') || msg.includes('无效') || msg.includes('无法识别')) {
            toast.info(msg);
            return;
          }
          if (msg === '操作失败，请稍后重试。') {
            toastErrorDeduped('city-lookup', '无法获取该位置对应的城市信息，请换个位置试试。', 2500);
            return;
          }
          toastErrorDeduped('city-lookup', msg, 2500);
        });
    },
    [setSelected],
  );

  const locateMe = React.useCallback((): void => {
    if (!('geolocation' in navigator)) {
      toast.error('当前浏览器不支持定位，请手动选择城市。');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gcj = wgs84ToGcj02(pos.coords.longitude, pos.coords.latitude);
        onMapClick({ lon: gcj.lon, lat: gcj.lat });
      },
      (e) => {
        const code = typeof e?.code === 'number' ? e.code : 0;
        const message =
          code === 1
            ? '定位权限已被拒绝，请在浏览器设置中开启定位后重试。'
            : code === 2
              ? '无法获取当前位置，请检查网络或系统定位服务后重试。'
              : code === 3
                ? '定位超时，请稍后重试。'
                : '定位失败，请稍后重试。';
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, [onMapClick]);

  return { picked, setPicked, onMapClick, locateMe };
}
