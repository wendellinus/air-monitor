import React from 'react';
import * as echarts from 'echarts';
import {
  AlertTriangle,
  Building2,
  CloudFog,
  CloudRain,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Search,
  Snowflake,
  SunMedium,
  Tornado,
  X,
  Zap,
} from 'lucide-react';

import type {
  AirHourlyItem,
  AirNowItem,
  CityItem,
  NoticeItem,
  WeatherAlertItem,
  WeatherAlertResponse,
} from '@air-monitor/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dock, DockIcon } from '@/components/ui/dock';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { gcj02ToWgs84, wgs84ToGcj02, type LonLat } from '@/lib/coords';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { api } from '../shared/api';
import { ApiError, type ApiResponse } from '../shared/types';
import { AMapPanel } from './widgets/amap-panel';
import {
  getAlertAccentColor,
  getAlertKind,
  getAlertKindLabel,
  type AlertKind,
  pickPrimaryAlert,
} from './widgets/alert-icon';
import { ScreenStage } from './widgets/screen-stage';

const toastDedupe = new Map<string, number>();

function toastErrorDeduped(key: string, message: string, ttlMs = 2500): void {
  const now = Date.now();
  const last = toastDedupe.get(key) ?? 0;
  if (now - last < ttlMs) return;
  toastDedupe.set(key, now);
  toast.error(message);
}

// Big-screen polling defaults (avoid stale data on wall displays).
const REFRESH_TOP_CITIES_MS = 30 * 60_000;
const REFRESH_NOTICES_MS = 5 * 60_000;
const REFRESH_AIR_MS = 60_000;
const REFRESH_ALERTS_MS = 3 * 60_000;

function formatDateTime(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatHourLabel(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function aqiTone(aqi: number): { label: string; className: string } {
  if (aqi <= 50) return { label: '优', className: 'text-emerald-200' };
  if (aqi <= 100) return { label: '良', className: 'text-lime-200' };
  if (aqi <= 150) return { label: '轻度', className: 'text-amber-200' };
  if (aqi <= 200) return { label: '中度', className: 'text-orange-200' };
  if (aqi <= 300) return { label: '重度', className: 'text-rose-200' };
  return { label: '严重', className: 'text-fuchsia-200' };
}

function alertSeverityLabel(value: string | undefined): string {
  const s = (value ?? '').trim().toLowerCase();
  if (!s) return '-';
  if (s === 'minor') return '轻微';
  if (s === 'moderate') return '中等';
  if (s === 'severe') return '严重';
  if (s === 'extreme') return '特别严重';
  return value ?? '-';
}

function humanizeError(input: unknown): string {
  const unknownMsg = '操作失败，请稍后重试。';

  const anyErr = input as
    | {
        message?: unknown;
        code?: unknown;
        response?: { data?: { msg?: unknown } };
      }
    | null
    | undefined;

  const msgFromApi = anyErr?.response?.data?.msg;
  if (typeof msgFromApi === 'string' && msgFromApi.trim()) return msgFromApi.trim();

  const raw = typeof anyErr?.message === 'string' ? anyErr.message : String(input ?? '');
  if (!raw) return unknownMsg;
  const lower = raw.toLowerCase();

  // QWeather Geo error codes. When clicking sea or invalid area, QWeather may return "204" (no data).
  const geoCodeMatch = lower.match(/qweather\\s+geo\\s+error:\\s*code=(\\d+)/i);
  if (geoCodeMatch) {
    const code = geoCodeMatch[1];
    if (code === '204' || code === '404') {
      return '该位置无法识别到有效城市（可能在海面/无人区），请选陆地位置。';
    }
    if (code === '400') {
      return '所选位置无效，请重新选择。';
    }
    if (code === '401' || code === '403') {
      return '定位服务暂不可用，请稍后再试。';
    }
    return '定位服务暂不可用，请稍后再试。';
  }

  // If backend already provided a user-friendly Chinese message, keep it.
  if (/[\u4e00-\u9fff]/.test(raw) && raw.length <= 60) return raw.trim();

  if (lower.includes('city not found')) return '未找到该位置对应的城市，请换个位置试试。';
  if (lower.includes('invalid') && (lower.includes('location') || lower.includes('coordinate')))
    return '所选位置无效（可能在海面或无有效地址），请重新选择。';
  if (lower.includes('not found') || lower.includes('404')) return '未找到相关数据，请换个位置试试。';
  if (lower.includes('network error') || lower.includes('failed to fetch'))
    return '网络异常，请检查网络后重试。';
  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('econnaborted'))
    return '请求超时，请稍后重试。';
  if (lower.includes('econnrefused') || lower.includes('connect') || lower.includes('socket'))
    return '服务暂不可用，请稍后重试。';

  // Avoid exposing raw technical strings to end users.
  return unknownMsg;
}

function GlassCard(props: React.ComponentProps<typeof Card>): React.ReactNode {
  return (
    <Card
      {...props}
      className={cn(
        'border-white/8 bg-black/8 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
        props.className,
      )}
    />
  );
}

function AlertKindIcon(props: { kind: AlertKind; className?: string }): React.ReactNode {
  const Icon = (() => {
    switch (props.kind) {
      case 'typhoon':
        return Tornado;
      case 'rain':
        return CloudRain;
      case 'thunder':
        return Zap;
      case 'heat':
        return SunMedium;
      case 'cold':
        return Snowflake;
      case 'fog':
        return CloudFog;
      case 'default':
      default:
        return AlertTriangle;
    }
  })();

  return <Icon className={cn('h-5 w-5', props.className)} strokeWidth={2.2} aria-hidden="true" />;
}

function LegendItem(props: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}): React.ReactNode {
  const hasDescription = Boolean(props.description);
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-white/8 bg-black/10 ring-1 ring-white/8',
        hasDescription ? 'items-start p-3' : 'items-center px-3 py-2',
      )}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-xl border border-white/8 bg-black/14 text-foreground/90 ring-1 ring-white/8',
          hasDescription ? 'h-9 w-9' : 'h-8 w-8',
        )}
      >
        {props.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-none text-foreground">{props.title}</div>
        {hasDescription ? (
          <div className="mt-1 text-xs leading-snug text-muted-foreground">{props.description}</div>
        ) : null}
      </div>
    </div>
  );
}

function EChartPanel(props: {
  title: string;
  description?: string;
  option: echarts.EChartsOption;
  cardClassName?: string;
  chartClassName?: string;
}): React.ReactNode {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.setOption(props.option);
    let disposed = false;
    const onResize = () => chart.resize();
    requestAnimationFrame(() => {
      if (disposed) return;
      chart.resize();
    });
    window.addEventListener('resize', onResize);
    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [props.option]);

  return (
    <GlassCard className={props.cardClassName}>
      <CardHeader className="gap-2">
        <CardTitle className="text-base">{props.title}</CardTitle>
        {props.description ? <CardDescription>{props.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-2">
        <div ref={ref} className={cn('w-full h-[clamp(150px,22vh,230px)]', props.chartClassName)} />
      </CardContent>
    </GlassCard>
  );
}

export function ScreenPage(): React.ReactNode {
  const [cities, setCities] = React.useState<CityItem[]>([]);
  const [selected, setSelected] = React.useState<CityItem | null>(null);
  const [picked, setPicked] = React.useState<LonLat | null>(null);
  const [air, setAir] = React.useState<AirNowItem | null>(null);
  const [airHourly, setAirHourly] = React.useState<AirHourlyItem[]>([]);
  const [notices, setNotices] = React.useState<NoticeItem[]>([]);
  const [alerts, setAlerts] = React.useState<WeatherAlertResponse | null>(null);
  const [now, setNow] = React.useState<Date>(() => new Date());

  const [searchOpen, setSearchOpen] = React.useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<CityItem[]>([]);
  const [searchLoading, setSearchLoading] = React.useState<boolean>(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(
    () => Boolean(typeof document !== 'undefined' && document.fullscreenElement),
  );

  const mapLookupAbortRef = React.useRef<AbortController | null>(null);
  const searchAbortRef = React.useRef<AbortController | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const selectedRef = React.useRef<CityItem | null>(null);

  const closeSearch = React.useCallback((): void => {
    searchAbortRef.current?.abort();
    setSearchOpen(false);
    setSearchKeyword('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
  }, []);

  const openSearch = React.useCallback((): void => {
    setSearchKeyword('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
    setSearchOpen(true);
  }, []);

  const selectedCoord = React.useMemo((): LonLat | null => {
    if (!selected) return null;
    const lon = toNumber(selected.lon);
    const lat = toNumber(selected.lat);
    if (lon === null || lat === null) return null;
    return { lon, lat };
  }, [selected]);

  React.useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    return () => mapLookupAbortRef.current?.abort();
  }, []);

  React.useEffect(() => {
    return () => searchAbortRef.current?.abort();
  }, []);

  React.useEffect(() => {
    if (!searchOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeSearch();
    };

    window.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [closeSearch, searchOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;
    const keyword = searchKeyword.trim();

    if (!keyword) {
      searchAbortRef.current?.abort();
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setSearchLoading(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      api
        .get<ApiResponse<CityItem[]>>('/city/search', {
          params: { keyword },
          signal: controller.signal,
        })
        .then((res) => {
          if (controller.signal.aborted) return;
          const list = Array.isArray(res.data.data) ? res.data.data : [];
          setSearchResults(list.slice(0, 28));
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
          const msg = humanizeError(e);
          setSearchResults([]);
          setSearchError(msg);
          toastErrorDeduped('city-search', msg, 2500);
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setSearchLoading(false);
        });
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchKeyword, searchOpen]);

  const onMapClick = React.useCallback((gcj: LonLat): void => {
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
        // Avoid showing a vague "operation failed" for map picking. Give users a reason + next action.
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
  }, []);

  const toggleFullscreen = React.useCallback(async (): Promise<void> => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore fullscreen errors (permissions / gesture requirements vary by browser).
    }
  }, []);

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    onChange();
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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

  React.useEffect(() => {
    const cityId = selected?.cityId;
    if (!cityId) {
      setAlerts(null);
      return;
    }

    let mounted = true;
    let inFlight: AbortController | null = null;
    let t: number | null = null;

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
        // Alerts are nice-to-have; keep it quiet but avoid permanent stale UI.
        setAlerts(null);
      }
    };

    void load();
    t = window.setInterval(() => void load(), REFRESH_ALERTS_MS);
    return () => {
      mounted = false;
      if (t !== null) window.clearInterval(t);
      inFlight?.abort();
    };
  }, [selected?.cityId]);

  React.useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attemptCount = 0;

    const load = async (): Promise<void> => {
      attemptCount++;
      try {
        const res = await api.get<ApiResponse<CityItem[]>>('/city/top', {
          params: { rangeType: 'cn', number: 10 },
        });
        if (!mounted) return;
        setCities(res.data.data);
        // Only auto-select on initial empty selection; don't override user's choice.
        if (!selectedRef.current) setSelected(res.data.data[0] ?? null);
      } catch (e) {
        if (!mounted) return;
        const msg = humanizeError(e);
        if (attemptCount === 1 || attemptCount >= 15) {
          toastErrorDeduped('city-top', msg, 6000);
        }
        if (attemptCount < 15) {
          timer = setTimeout(() => {
            void load();
          }, 1200);
        }
      }
    };

    (async () => {
      await load();
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
      if (timer) clearTimeout(timer);
    };
  }, []);

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

    const t1 = window.setInterval(() => void refreshTopCities(), REFRESH_TOP_CITIES_MS);
    const t2 = window.setInterval(() => void refreshNotices(), REFRESH_NOTICES_MS);

    return () => {
      mounted = false;
      window.clearInterval(t1);
      window.clearInterval(t2);
    };
  }, []);

  React.useEffect(() => {
    if (!selected) return;
    setAir(null);
    setAirHourly([]);
    let mounted = true;
    let inFlight: AbortController | null = null;
    let t: number | null = null;

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
    t = window.setInterval(() => void load(), REFRESH_AIR_MS);
    return () => {
      mounted = false;
      if (t !== null) window.clearInterval(t);
      inFlight?.abort();
    };
  }, [selected?.cityId]);

  const trendOption: echarts.EChartsOption = React.useMemo(() => {
    const points = airHourly
      .map((x) => {
        const time =
          typeof (x as Record<string, unknown>)['fxTime'] === 'string'
            ? ((x as Record<string, unknown>)['fxTime'] as string)
            : typeof x.pubTime === 'string'
              ? x.pubTime
              : typeof (x as Record<string, unknown>)['updateTime'] === 'string'
                ? ((x as Record<string, unknown>)['updateTime'] as string)
                : undefined;
        const aqi =
          toNumber((x as Record<string, unknown>)['aqi']) ??
          (typeof x.aqi === 'number' ? x.aqi : null);
        const ms = time ? new Date(time).getTime() : Number.NaN;
        return time && aqi !== null && !Number.isNaN(ms) ? { time, aqi, ms } : null;
      })
      .filter((v): v is { time: string; aqi: number; ms: number } => v !== null)
      .sort((a, b) => a.ms - b.ms)
      .slice(-5);

    const labels = points.map((p) => formatHourLabel(p.time));
    const uniqueLabels = new Set(labels.filter((x) => x !== '-')).size;
    const x =
      uniqueLabels >= 2
        ? labels
        : points.map((_, i) => (i === points.length - 1 ? 'now' : `-${points.length - 1 - i}h`));
    const y = points.map((p) => p.aqi);

    return {
      backgroundColor: 'transparent',
      grid: { left: 54, right: 18, top: 26, bottom: 46 },
      xAxis: {
        type: 'category',
        data: x,
        name: '时间(h)',
        nameGap: 22,
        nameTextStyle: { color: 'rgba(255,255,255,0.60)' },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.20)' } },
        axisLabel: { color: 'rgba(255,255,255,0.65)' },
      },
      yAxis: {
        type: 'value',
        min: 0,
        name: 'AQI(指数)',
        nameGap: 34,
        nameTextStyle: { color: 'rgba(255,255,255,0.60)' },
        axisLine: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.65)' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.10)' } },
      },
      series: [
        {
          type: 'line',
          data: y,
          smooth: true,
          symbolSize: 6,
          lineStyle: { width: 2, color: '#4dd4ff' },
          areaStyle: { color: 'rgba(77,212,255,0.14)' },
        },
      ],
      tooltip: { trigger: 'axis' },
    };
  }, [airHourly]);

  const pollutantOption: echarts.EChartsOption = React.useMemo(() => {
    const rows: Array<{ name: string; value: number }> = [
      { name: 'PM2.5', value: air?.pm2p5 ?? 0 },
      { name: 'PM10', value: air?.pm10 ?? 0 },
      { name: 'NO2', value: air?.no2 ?? 0 },
      { name: 'SO2', value: air?.so2 ?? 0 },
      { name: 'CO', value: air?.co ?? 0 },
      { name: 'O3', value: air?.o3 ?? 0 },
    ];

    return {
      backgroundColor: 'transparent',
      grid: { left: 74, right: 18, top: 24, bottom: 30 },
      xAxis: {
        type: 'value',
        name: '浓度(μg/m³)\nCO: mg/m³',
        nameGap: 22,
        nameTextStyle: { color: 'rgba(255,255,255,0.58)' },
        axisLabel: { color: 'rgba(255,255,255,0.60)' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.10)' } },
      },
      yAxis: {
        type: 'category',
        data: rows.map((r) => r.name),
        name: '污染物(类别)',
        nameGap: 36,
        nameTextStyle: { color: 'rgba(255,255,255,0.58)' },
        axisLabel: { color: 'rgba(255,255,255,0.75)' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: rows.map((r) => r.value),
          barWidth: 10,
          itemStyle: {
            borderRadius: [8, 8, 8, 8],
            color: 'rgba(77,212,255,0.55)',
          },
        },
      ],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    };
  }, [air?.pm2p5, air?.pm10, air?.no2, air?.so2, air?.co, air?.o3]);

  const tone = aqiTone(air?.aqi ?? 0);

  const trimmedSearchKeyword = searchKeyword.trim();
  const marquee = notices.length > 0 ? notices.map((n) => n.title).join(' · ') : '暂无公告';

  const selectedAlerts: WeatherAlertItem[] = Array.isArray(alerts?.alerts) ? alerts.alerts : [];
  const primaryAlert = pickPrimaryAlert(selectedAlerts);
  const showMapAlert = Boolean(
    selected && selectedCoord && primaryAlert && selectedAlerts.length > 0,
  );
  const mapAlertKind = primaryAlert ? getAlertKind(primaryAlert) : 'default';
  const mapAlertColor = primaryAlert ? getAlertAccentColor(primaryAlert) : null;
  const mapAlertToneClassName = (() => {
    const s = (primaryAlert?.severity ?? '').trim().toLowerCase();
    if (s === 'extreme' || s === 'severe') return 'text-rose-200';
    if (s === 'moderate') return 'text-amber-200';
    if (s === 'minor') return 'text-sky-200';
    return 'text-primary';
  })();

  const mapMarkers = React.useMemo(() => {
    return cities
      .map((c) => {
        const lon = toNumber(c.lon);
        const lat = toNumber(c.lat);
        if (lon === null || lat === null) return null;
        return { id: c.cityId, name: c.name, lon, lat };
      })
      .filter((v): v is { id: string; name: string; lon: number; lat: number } => v !== null);
  }, [cities]);

  const selectedCityId = selected?.cityId ?? null;
  const renderCityMarker = React.useCallback(
    ({ id, name }: { id: string; name: string }): React.ReactNode => {
      const isSelected = Boolean(selectedCityId && id === selectedCityId);
      return (
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'relative grid h-9 w-9 place-items-center rounded-2xl border shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 backdrop-blur-md',
              isSelected
                ? 'border-primary/28 bg-primary/14 text-primary ring-primary/20'
                : 'border-white/14 bg-black/40 text-foreground/86 ring-white/10',
            )}
            aria-label={`城市：${name}`}
          >
            <span
              className={cn(
                'pointer-events-none absolute -inset-2 rounded-[20px] blur-md',
                isSelected ? 'bg-primary/12' : 'bg-cyan-200/10',
              )}
            />
            <Building2
              className="relative h-[18px] w-[18px]"
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </div>
          <div
            className={cn(
              'relative h-2 w-2 rounded-full shadow-[0_10px_26px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
              isSelected ? 'bg-primary' : 'bg-cyan-200',
            )}
          >
            <span
              className={cn(
                'absolute -inset-2 rounded-full blur-md',
                isSelected ? 'bg-primary/12' : 'bg-cyan-200/10',
              )}
            />
          </div>
        </div>
      );
    },
    [selectedCityId],
  );

  const renderPickedMarker = React.useCallback((): React.ReactNode => {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-cyan-200/22 bg-cyan-200/10 text-cyan-100 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 ring-cyan-200/18 backdrop-blur-md">
          <span className="pointer-events-none absolute -inset-2 rounded-[22px] bg-cyan-200/10 blur-md" />
          <MapPin className="relative h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="relative h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_10px_26px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
          <span className="absolute -inset-2 rounded-full bg-cyan-200/10 blur-md" />
        </div>
      </div>
    );
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <AMapPanel
          center={selectedCoord}
          markers={mapMarkers}
          renderMarker={renderCityMarker}
          onMarkerClick={(id) => {
            const found = cities.find((c) => c.cityId === id) ?? null;
            setSelected(found);
          }}
          onMapClick={onMapClick}
          pinMarker={picked}
          renderPinMarker={renderPickedMarker}
          alertMarker={
            showMapAlert && selected && selectedCoord
              ? { id: selected.cityId, lon: selectedCoord.lon, lat: selectedCoord.lat }
              : null
          }
          renderAlertMarker={() =>
            showMapAlert && selected && primaryAlert ? (
              <HoverCard openDelay={250} closeDelay={180}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'group relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-md transition-transform hover:scale-105',
                      mapAlertToneClassName,
                    )}
                    style={mapAlertColor ? { color: mapAlertColor } : undefined}
                    aria-label={`${selected.name} 预警 ${selectedAlerts.length} 条：${
                      primaryAlert.headline ?? ''
                    }`}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <AlertKindIcon kind={mapAlertKind} className="h-[18px] w-[18px]" />
                      <span className="mt-0.5 text-[10px] font-semibold">
                        {getAlertKindLabel(mapAlertKind)}
                      </span>
                    </div>
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-black/70 px-1 text-[11px] font-semibold text-foreground ring-1 ring-white/15">
                      {selectedAlerts.length}
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="top"
                  sideOffset={10}
                  className="z-[9999] w-[420px] max-w-[min(420px,calc(100vw-24px))] border-white/8 bg-black/50 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.50)] ring-1 ring-white/10 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {selected.name}
                        <span className="mx-2 text-muted-foreground">·</span>
                        {primaryAlert.eventType?.name ?? '预警'}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        严重程度：{alertSeverityLabel(primaryAlert.severity)}
                        <span className="mx-2">·</span>共 {selectedAlerts.length} 条
                      </div>
                    </div>
                    <div
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs ring-1',
                        mapAlertToneClassName,
                        'ring-white/10',
                      )}
                    >
                      {getAlertKindLabel(mapAlertKind)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-medium leading-snug text-foreground">
                      {primaryAlert.headline}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      生效：{formatDateTime(primaryAlert.effectiveTime)}
                      <span className="mx-2">·</span>
                      结束：{formatDateTime(primaryAlert.expireTime)}
                    </div>
                    <div className="max-h-[240px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {primaryAlert.description}
                    </div>
                    {primaryAlert.instruction ? (
                      <div className="rounded-md border border-white/8 bg-black/20 p-3 text-sm text-foreground/90">
                        <div className="mb-1 text-xs font-semibold text-muted-foreground">
                          防御指引
                        </div>
                        <div className="whitespace-pre-wrap">{primaryAlert.instruction}</div>
                      </div>
                    ) : null}
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : null
          }
        />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/40 via-black/0 to-black/62" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/32 via-transparent to-black/32" />
        <div className="pointer-events-none absolute -inset-24 opacity-50 [background:radial-gradient(closest-side,rgba(77,212,255,0.22),transparent_64%)]" />
      </div>

      <ScreenStage className="pointer-events-none">
        <div className="pointer-events-none relative flex h-full w-full flex-col gap-3 p-0">
          <header className="pointer-events-auto relative z-30 flex w-full items-center rounded-[var(--radius)] border border-white/8 bg-black/22 px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-lg">
            <div className="flex items-center gap-4">
              <div className="text-base font-semibold tracking-[0.22em]">空气质量监测</div>
            </div>

            <div className="mx-6 flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0 truncate text-sm text-muted-foreground">{marquee}</div>
            </div>

            <div className="flex items-center gap-4">
              <InputGroup
                role="button"
                tabIndex={0}
                aria-haspopup="dialog"
                aria-expanded={searchOpen}
                onClick={openSearch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSearch();
                  }
                }}
                className={cn(
                  'h-9 w-[260px] cursor-pointer bg-black/24 shadow-[0_18px_60px_rgba(0,0,0,0.45)]',
                  'hidden md:flex',
                )}
              >
                <InputGroupInput
                  placeholder="搜索数据…"
                  readOnly
                  aria-label="打开搜索"
                  className="cursor-pointer py-0"
                />
                <InputGroupAddon className="px-3">
                  <Search className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                </InputGroupAddon>
              </InputGroup>

              <div className="text-sm text-muted-foreground">{now.toLocaleString()}</div>
              <Button asChild size="sm" variant="outline">
                <a href="/admin/login">管理后台</a>
              </Button>
            </div>
          </header>

          {searchOpen ? (
            <div className="pointer-events-auto fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                onMouseDown={() => closeSearch()}
                aria-hidden="true"
              />

              <div className="absolute left-1/2 top-16 w-[min(720px,calc(100%-2rem))] -translate-x-1/2">
                <GlassCard className="bg-black/10 ring-white/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-foreground">搜索城市</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        输入关键词搜索；回车选择第一项；ESC 关闭
                      </div>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        'rounded-xl border border-white/8 bg-black/7 p-2 text-foreground/80 ring-1 ring-white/8 transition-colors',
                        'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                      )}
                      onClick={closeSearch}
                      aria-label="关闭搜索"
                    >
                      <X className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <InputGroup className="h-10">
                      <InputGroupInput
                        ref={searchInputRef}
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const first = searchResults[0] ?? null;
                          if (!first) return;
                          setSelected(first);
                          closeSearch();
                        }}
                        placeholder="搜索城市…"
                        autoComplete="off"
                        className="py-0"
                      />
                      <InputGroupAddon className="flex gap-2 px-2.5">
                        {trimmedSearchKeyword ? (
                          <button
                            type="button"
                            className={cn(
                              'grid h-7 w-7 place-items-center rounded-lg border border-white/8 bg-black/7 text-foreground/75 ring-1 ring-white/8 transition-colors',
                              'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                            )}
                            onClick={() => {
                              setSearchKeyword('');
                              setSearchResults([]);
                              setSearchError(null);
                              setSearchLoading(false);
                              requestAnimationFrame(() => searchInputRef.current?.focus());
                            }}
                            aria-label="清除搜索"
                          >
                            <X className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                          </button>
                        ) : null}

                        {searchLoading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
                        ) : (
                          <Search className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                        )}
                      </InputGroupAddon>
                    </InputGroup>

                    <div className="rounded-2xl border border-white/10 bg-black/10 ring-1 ring-white/8">
                      <ScrollArea className="h-[320px]">
                        <div className="flex flex-col gap-2 p-3">
                          {!searchLoading &&
                          !searchError &&
                          trimmedSearchKeyword &&
                          searchResults.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-muted-foreground ring-1 ring-white/8">
                              暂无匹配城市，请换用其他关键词试试。
                            </div>
                          ) : null}

                          {searchResults.map((c) => (
                            <button
                              key={c.cityId}
                              type="button"
                              className={cn(
                                'group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/7 px-3 py-2 text-left ring-1 ring-white/8 transition-colors',
                                'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                              )}
                              onClick={() => {
                                setSelected(c);
                                closeSearch();
                              }}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">
                                  {c.name}
                                </div>
                                <div className="mt-1 truncate text-xs text-muted-foreground">
                                  {[c.adm1, c.adm2, c.country].filter(Boolean).join(' · ')}
                                </div>
                              </div>
                              <div className="shrink-0 text-xs text-muted-foreground/80">
                                {selected?.cityId === c.cityId ? '当前' : '选择'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          ) : null}

          <main className="relative z-0 flex-1">
            <div className="absolute inset-0">
              <div className="pointer-events-auto absolute left-2 top-0 bottom-0 w-[300px] min-h-0">
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <GlassCard className="p-4 rounded-[8px]">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base">{selected?.name ?? '未选择城市'}</CardTitle>
                      <CardDescription className="text-sm">
                        {selected
                          ? `${selected.adm1}${selected.adm2 ? ` · ${selected.adm2}` : ''}`
                          : '点击热门城市或地图定位选择城市'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="flex items-end justify-between">
                        <div
                          className={cn(
                            'text-5xl font-semibold tracking-tight drop-shadow',
                            tone.className,
                          )}
                        >
                          {air?.aqi ?? '-'}
                        </div>
                        <div className="text-right">
                          <div className={cn('text-base font-semibold', tone.className)}>
                            {tone.label}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>发布时间：{formatDateTime(air?.pubTime)}</div>
                        <div>首要污染物：{air?.primary ?? '-'}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <Card className="rounded-xl border-white/8 bg-black/8 ring-1 ring-white/8 backdrop-blur-xl">
                          <CardContent className="p-2.5">
                            <div className="text-muted-foreground">PM2.5</div>
                            <div className="mt-1 text-sm font-medium">{air?.pm2p5 ?? '-'}</div>
                          </CardContent>
                        </Card>
                        <Card className="rounded-xl border-white/8 bg-black/8 ring-1 ring-white/8 backdrop-blur-xl">
                          <CardContent className="p-2.5">
                            <div className="text-muted-foreground">PM10</div>
                            <div className="mt-1 text-sm font-medium">{air?.pm10 ?? '-'}</div>
                          </CardContent>
                        </Card>
                        <Card className="rounded-xl border-white/8 bg-black/8 ring-1 ring-white/8 backdrop-blur-xl">
                          <CardContent className="p-2.5">
                            <div className="text-muted-foreground">O3</div>
                            <div className="mt-1 text-sm font-medium">{air?.o3 ?? '-'}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </GlassCard>

                  <GlassCard className="flex min-h-0 flex-1 flex-col rounded-[8px]">
                    <CardHeader className="p-5 pb-4">
                      <CardTitle className="text-base">热门城市</CardTitle>
                      <CardDescription className="text-sm">
                        点击列表或地图点位切换城市
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 p-0">
                      <div
                        className="h-full"
                        onWheelCapture={(e) => e.stopPropagation()}
                        onTouchMoveCapture={(e) => e.stopPropagation()}
                      >
                        <ScrollArea className="h-full">
                          <div className="flex flex-col gap-2 p-5 pt-2 pb-6">
                            {cities.map((c) => (
                              <Button
                                key={c.cityId}
                                size="sm"
                                variant="ghost"
                                className={cn(
                                  'w-full justify-center rounded-2xl border px-2.5 py-1.5 text-center text-[13px] font-medium transition-colors',
                                  'border-white/8 bg-black/7 text-foreground/90 ring-1 ring-white/8',
                                  'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                                  selected?.cityId === c.cityId &&
                                    'border-primary/25 bg-primary/12 text-foreground ring-primary/20',
                                )}
                                onClick={() => setSelected(c)}
                              >
                                {c.name}
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </GlassCard>
                </div>
              </div>

              <div className="pointer-events-auto absolute top-0 right-2 bottom-0 w-[400px] min-h-0">
                <div
                  className="h-full"
                  onWheelCapture={(e) => e.stopPropagation()}
                  onTouchMoveCapture={(e) => e.stopPropagation()}
                >
                  <ScrollArea className="h-full" data-panel="right">
                    <div className="flex min-h-full flex-col gap-3 pl-2 pr-2">
                      <EChartPanel
                        title="AQI 趋势"
                        description="最近 5 个小时"
                        option={trendOption}
                        cardClassName="bg-black/6 ring-white/10 border-white/16 p-4 rounded-[8px]"
                      />
                      <EChartPanel
                        title="污染物浓度"
                        description="当前主要污染物"
                        option={pollutantOption}
                        cardClassName="bg-black/6 ring-white/10 border-white/16 p-4 rounded-[8px]"
                      />
                      <GlassCard className="bg-black/6 ring-white/10 border-white/16 p-4 rounded-[8px]">
                        <CardHeader className="gap-2 pb-4">
                          <CardTitle className="text-base">图例</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="rounded-2xl border border-white/8 bg-black/6 ring-1 ring-white/8">
                            <ScrollArea className="h-[260px] pr-2">
                              <div className="grid grid-cols-2 gap-2 p-2">
                                <LegendItem
                                  icon={
                                    <Building2
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title="热门城市"
                                />
                                <LegendItem
                                  icon={
                                    <MapPin
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title="定位"
                                />
                                <LegendItem
                                  icon={
                                    <AlertTriangle
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title="预警"
                                />
                                <LegendItem
                                  icon={
                                    <Tornado
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title={getAlertKindLabel('typhoon')}
                                />
                                <LegendItem
                                  icon={
                                    <CloudRain
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title={getAlertKindLabel('rain')}
                                />
                                <LegendItem
                                  icon={
                                    <Zap className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                                  }
                                  title={getAlertKindLabel('thunder')}
                                />
                                <LegendItem
                                  icon={
                                    <SunMedium
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title={getAlertKindLabel('heat')}
                                />
                                <LegendItem
                                  icon={
                                    <Snowflake
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title={getAlertKindLabel('cold')}
                                />
                                <LegendItem
                                  icon={
                                    <CloudFog
                                      className="h-5 w-5"
                                      strokeWidth={2.2}
                                      aria-hidden="true"
                                    />
                                  }
                                  title={getAlertKindLabel('fog')}
                                />
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </GlassCard>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </main>

          <div className="pointer-events-auto absolute bottom-2 left-1/2 z-40 -translate-x-1/2">
            <Dock
              className={cn(
                'mt-0 rounded-[var(--radius)] border-white/16 bg-black/30 shadow-[0_18px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
                'supports-backdrop-blur:bg-black/22 backdrop-saturate-150',
              )}
              iconSize={44}
              iconMagnification={70}
              iconDistance={160}
              direction="middle"
            >
              <DockIcon
                role="button"
                tabIndex={0}
                aria-label="全屏"
                title="全屏"
                className={cn(
                  'text-foreground/90 transition-colors',
                  'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                  isFullscreen && 'bg-white/8',
                )}
                onClick={() => void toggleFullscreen()}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  void toggleFullscreen();
                }}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
                )}
              </DockIcon>

              <DockIcon
                role="button"
                tabIndex={0}
                aria-label="定位到当前位置"
                title="定位到当前位置"
                className={cn(
                  'text-foreground/90 transition-colors',
                  'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                )}
                onClick={locateMe}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  locateMe();
                }}
              >
                <LocateFixed className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
              </DockIcon>
            </Dock>
          </div>
        </div>
      </ScreenStage>
    </div>
  );
}
