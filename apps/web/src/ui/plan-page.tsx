import React from 'react';

import type { AirNowItem, CityItem } from '@go-practice/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { gcj02ToWgs84, type LonLat } from '@/lib/coords';

import { api } from '../shared/api';
import type { ApiResponse } from '../shared/types';
import { AMapPanel } from './widgets/amap-panel';

function formatDateTime(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function aqiTone(aqi: number): { label: string; className: string } {
  if (aqi <= 50) return { label: '优', className: 'text-emerald-200' };
  if (aqi <= 100) return { label: '良', className: 'text-lime-200' };
  if (aqi <= 150) return { label: '轻度', className: 'text-amber-200' };
  if (aqi <= 200) return { label: '中度', className: 'text-orange-200' };
  if (aqi <= 300) return { label: '重度', className: 'text-rose-200' };
  return { label: '严重', className: 'text-fuchsia-200' };
}

function GlassCard(props: React.ComponentProps<typeof Card>): React.ReactNode {
  return (
    <Card
      {...props}
      className={cn(
        'border-white/10 bg-black/12 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.64)] ring-1 ring-white/12',
        props.className,
      )}
    />
  );
}

export function PlanPage(): React.ReactNode {
  const [now, setNow] = React.useState<Date>(() => new Date());
  const [picked, setPicked] = React.useState<LonLat | null>(null);
  const [city, setCity] = React.useState<CityItem | null>(null);
  const [air, setAir] = React.useState<AirNowItem | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadByLonLat = React.useCallback(async (coord: LonLat): Promise<void> => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<CityItem[]>>('/city/lookup', {
        params: { lon: coord.lon, lat: coord.lat },
      });
      const found = res.data.data[0] ?? null;
      if (!found) {
        setCity(null);
        setAir(null);
        setError('未找到该位置对应的城市');
        return;
      }

      setCity(found);
      const airRes = await api.get<ApiResponse<AirNowItem>>('/air/now', { params: { city_id: found.cityId } });
      setAir(airRes.data.data);
      setError(null);
    } catch (e) {
      setCity(null);
      setAir(null);
      setError(e instanceof Error ? e.message : String(e ?? '加载失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  const onMapClick = React.useCallback(
    (gcj: LonLat): void => {
      const wgs = gcj02ToWgs84(gcj.lon, gcj.lat);
      setPicked(wgs);
      void loadByLonLat(wgs);
    },
    [loadByLonLat],
  );

  const tone = aqiTone(air?.aqi ?? 0);
  const markers =
    city && picked
      ? [{ id: city.cityId, name: city.name, lon: picked.lon, lat: picked.lat }]
      : [];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <AMapPanel
          center={picked}
          coordSystem="wgs84"
          markers={markers}
          onMarkerClick={() => {}}
          onMapClick={onMapClick}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/35 via-black/0 to-black/55" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/45 via-transparent to-black/45" />
        <div className="pointer-events-none absolute -inset-24 opacity-35 [background:radial-gradient(closest-side,rgba(77,212,255,0.16),transparent_64%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 p-6">
        <div className="pointer-events-auto flex items-center justify-between rounded-[var(--radius)] border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-lg shadow-[0_18px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/5">
          <div className="flex items-center gap-4">
            <div className="text-base font-semibold tracking-[0.22em]">PLAN</div>
            <div className="text-sm text-muted-foreground">点击地图选择地点</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">{now.toLocaleString()}</div>
            <Button asChild size="sm" variant="outline">
              <a href="/screen">返回大屏</a>
            </Button>
          </div>
        </div>

        <div className="pointer-events-auto mt-4 w-[420px] max-w-[calc(100vw-48px)]">
          <GlassCard>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{city?.name ?? '未选择地点'}</CardTitle>
              <CardDescription className="text-sm">
                {picked ? `坐标：${picked.lon.toFixed(4)}, ${picked.lat.toFixed(4)}` : '点击地图任意位置'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? <div className="text-sm text-destructive">{error}</div> : null}
              {loading ? <div className="text-sm text-muted-foreground">加载中…</div> : null}
              {air ? (
                <>
                  <div className="flex items-end justify-between">
                    <div className={cn('text-5xl font-semibold tracking-tight drop-shadow', tone.className)}>
                      {air.aqi}
                    </div>
                    <div className="text-right">
                      <div className={cn('text-base font-semibold', tone.className)}>{tone.label}</div>
                      <div className="text-sm text-muted-foreground">{air.category || '-'}</div>
                    </div>
                  </div>
                  <div className="space-y-1 px-1 text-sm text-muted-foreground">
                    <div>更新时间：{formatDateTime(air.pubTime)}</div>
                    <div>首要污染物：{air.primary ?? '-'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2.5 ring-1 ring-white/5">
                      <div className="text-muted-foreground">PM2.5</div>
                      <div className="mt-1 text-sm font-medium">{air.pm2p5}</div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2.5 ring-1 ring-white/5">
                      <div className="text-muted-foreground">PM10</div>
                      <div className="mt-1 text-sm font-medium">{air.pm10}</div>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/25 px-3 py-2.5 ring-1 ring-white/5">
                      <div className="text-muted-foreground">O₃</div>
                      <div className="mt-1 text-sm font-medium">{air.o3}</div>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
