import { Inject } from '@nestjs/common';
import axios from 'axios';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from '../redis/redis.constants';

import { QweatherClient } from './qweather.client';
import { normalizeQweatherAirRealtime, normalizeQweatherAirTimelineItem } from './qweather-air-normalize';
import {
  QWEATHER_AIR_PROVIDER,
  QWEATHER_ALERT_PROVIDER,
  QWEATHER_FINANCE_PROVIDER,
  QWEATHER_GEO_PROVIDER,
} from './qweather.tokens';
import type {
  QweatherAirRealtime,
  QweatherGeoCity,
  QweatherSummary,
  QweatherTopCityRange,
  QweatherStats,
  QweatherWeatherAlert,
} from './qweather.types';

export interface GeoProvider {
  fetchGeo(keyword: string): Promise<QweatherGeoCity[]>;
  getTopCities(rangeType: QweatherTopCityRange, number: number): Promise<QweatherGeoCity[]>;
}

export interface AirProvider {
  fetchRealtime(lat: string, lon: string): Promise<QweatherAirRealtime>;
  fetchHourly(lat: string, lon: string): Promise<Array<Record<string, unknown>>>;
  fetchDaily(lat: string, lon: string): Promise<Array<Record<string, unknown>>>;
}

export interface AlertProvider {
  fetchWeatherAlert(lat: string, lon: string): Promise<QweatherWeatherAlert>;
}

export interface FinanceProvider {
  fetchSummary(): Promise<QweatherSummary>;
  fetchStats(): Promise<QweatherStats>;
}

class QweatherGeoProvider implements GeoProvider {
  constructor(
    private readonly client: QweatherClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async fetchGeo(keyword: string): Promise<QweatherGeoCity[]> {
    const cacheKey = `qweather:geo:${keyword}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as QweatherGeoCity[];

    let data: { code?: string; location?: Array<Record<string, unknown>> };
    try {
      // Matches legacy Go behavior: /geo/v2/city/lookup?location=...
      data = await this.client.get<{
        code?: string;
        location?: Array<Record<string, unknown>>;
      }>('/geo/v2/city/lookup', { location: keyword });
    } catch (e) {
      // If QWeather rejects the location (HTTP 400), treat it as "no data" so the UI can guide
      // users to pick a valid land address instead of showing a generic operation error.
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        if (status === 400) {
          await this.redis.set(cacheKey, JSON.stringify([]), 'EX', 60 * 2);
          return [];
        }
        if (status === 401 || status === 403) {
          throw new Error('定位服务鉴权失败，请检查 QWeather 配置。');
        }
        if (status === 429) {
          throw new Error('定位服务请求过于频繁，请稍后重试。');
        }
        if (typeof status === 'number' && status >= 500) {
          throw new Error('定位服务暂不可用，请稍后重试。');
        }
      }
      throw e;
    }

    // QWeather returns "204" for "no data". Treat it as an empty result so the UI can
    // show a "no valid address/city" hint (e.g. when clicking sea) instead of a hard error.
    if (data.code === '204') {
      await this.redis.set(cacheKey, JSON.stringify([]), 'EX', 60 * 10);
      return [];
    }

    if (data.code && data.code !== '200') {
      throw new Error(`QWeather Geo error: code=${data.code}`);
    }

    const cities: QweatherGeoCity[] = (data.location ?? []).map((x) => ({
      cityId: String(x['id'] ?? ''),
      name: String(x['name'] ?? ''),
      lat: String(x['lat'] ?? ''),
      lon: String(x['lon'] ?? ''),
      adm2: String(x['adm2'] ?? ''),
      adm1: String(x['adm1'] ?? ''),
      country: String(x['country'] ?? ''),
    }));

    await this.redis.set(cacheKey, JSON.stringify(cities), 'EX', 60 * 10);
    return cities;
  }

  async getTopCities(rangeType: QweatherTopCityRange, number: number): Promise<QweatherGeoCity[]> {
    const rt = rangeType || 'world';
    const n = number > 0 ? number : 10;
    const cacheKey = `qweather:geo:top:${rt}:${n}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as QweatherGeoCity[];

    const data = await this.client.get<{
      code?: string;
      topCityList?: Array<Record<string, unknown>>;
    }>('/geo/v2/city/top', { range: rt, number: n });

    if (data.code && data.code !== '200') {
      throw new Error(`QWeather Top Cities error: code=${data.code}`);
    }

    const cities: QweatherGeoCity[] = (data.topCityList ?? []).map((x) => ({
      cityId: String(x['id'] ?? ''),
      name: String(x['name'] ?? ''),
      lat: String(x['lat'] ?? ''),
      lon: String(x['lon'] ?? ''),
      adm2: String(x['adm2'] ?? ''),
      adm1: String(x['adm1'] ?? ''),
      country: String(x['country'] ?? ''),
    }));

    await this.redis.set(cacheKey, JSON.stringify(cities), 'EX', 60 * 60);
    return cities;
  }
}

class QweatherAirProvider implements AirProvider {
  constructor(
    private readonly client: QweatherClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private isEmptyRealtime(r: QweatherAirRealtime): boolean {
    return (
      r.aqi === 0 &&
      r.pm10 === 0 &&
      r.pm2p5 === 0 &&
      r.no2 === 0 &&
      r.so2 === 0 &&
      r.co === 0 &&
      r.o3 === 0 &&
      !r.category &&
      !r.level
    );
  }

  private assertOk(data: Record<string, unknown>, label: string): void {
    const code = data['code'];
    if (typeof code === 'string' && code !== '200') {
      throw new Error(`QWeather ${label} error: code=${code}`);
    }
  }

  private normalizeRealtime(data: Record<string, unknown>): QweatherAirRealtime {
    // Note: JWT endpoints use a different response shape than v7. Keep this logic
    // in a dedicated utility so it's unit-testable and can evolve without touching the provider.
    return normalizeQweatherAirRealtime(data);
  }

  async fetchRealtime(lat: string, lon: string): Promise<QweatherAirRealtime> {
    const cacheKey = `qweather:air:realtime:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as unknown;
      if (typeof parsed === 'object' && parsed && 'pubTime' in (parsed as Record<string, unknown>)) {
        const r = parsed as QweatherAirRealtime;
        if (!this.isEmptyRealtime(r)) return r;
        await this.redis.del(cacheKey);
      }
    }

    const mode = this.client.getAuthMode();
    const data =
      mode === 'apiKey'
        ? await this.client.get<Record<string, unknown>>('/v7/air/now', { location: `${lon},${lat}` })
        : await this.client.get<Record<string, unknown>>(`/airquality/v1/current/${lat}/${lon}`);
    const now = this.normalizeRealtime(data);
    await this.redis.set(cacheKey, JSON.stringify(now), 'EX', 60 * 45);
    return now;
  }

  async fetchHourly(lat: string, lon: string): Promise<Array<Record<string, unknown>>> {
    // QWeather API key endpoints don't provide an hourly air-quality timeline.
    // Keep the contract stable by returning an empty list in API key mode.
    if (this.client.getAuthMode() === 'apiKey') return [];

    const cacheKey = `qweather:air:hourly:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as unknown;
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) return parsed as Array<Record<string, unknown>>;
      }
      await this.redis.del(cacheKey);
    }

    const data = await this.client.get<Record<string, unknown>>(`/airquality/v1/hourly/${lat}/${lon}`);
    this.assertOk(data, 'Air Hourly');

    // JWT (v1) responses may use different property names. Be defensive here.
    const candidates: unknown[] = [data['hourly'], data['hours'], data['data']];
    let rawList: Array<Record<string, unknown>> = [];
    for (const c of candidates) {
      if (Array.isArray(c)) {
        rawList = c.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
        break;
      }
      if (typeof c === 'object' && c !== null) {
        const nested = (c as Record<string, unknown>)['hourly'] ?? (c as Record<string, unknown>)['hours'];
        if (Array.isArray(nested)) {
          rawList = nested.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
          break;
        }
      }
    }

    const list = rawList
      .map((x) => normalizeQweatherAirTimelineItem(x))
      .filter((x): x is Record<string, unknown> => x !== null);

    await this.redis.set(cacheKey, JSON.stringify(list), 'EX', 60 * 45);
    return list;
  }

  async fetchDaily(lat: string, lon: string): Promise<Array<Record<string, unknown>>> {
    const cacheKey = `qweather:air:daily:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as unknown;
      if (Array.isArray(parsed)) return parsed as Array<Record<string, unknown>>;
      await this.redis.del(cacheKey);
    }

    const mode = this.client.getAuthMode();
    const data =
      mode === 'apiKey'
        ? await this.client.get<Record<string, unknown>>('/v7/air/5d', { location: `${lon},${lat}` })
        : await this.client.get<Record<string, unknown>>(`/airquality/v1/daily/${lat}/${lon}`);
    this.assertOk(data, 'Air Daily');
    const list = (data['daily'] as Array<Record<string, unknown>> | undefined) ?? [];
    await this.redis.set(cacheKey, JSON.stringify(list), 'EX', 60 * 60 * 10);
    return list;
  }
}

class QweatherAlertProvider implements AlertProvider {
  constructor(
    private readonly client: QweatherClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async fetchWeatherAlert(lat: string, lon: string): Promise<QweatherWeatherAlert> {
    const cacheKey = `qweather:alert:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as QweatherWeatherAlert;

    const data = await this.client.get<Record<string, unknown>>(`/weatheralert/v1/current/${lat}/${lon}`);
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 60 * 10);

    const zeroResult = Boolean((data['metadata'] as Record<string, unknown> | undefined)?.['zeroResult']);
    const alerts = (data['alerts'] as Array<Record<string, unknown>> | undefined) ?? [];

    return {
      zeroResult,
      alerts: alerts.map((a) => ({
        id: String(a['id'] ?? ''),
        headline: String(a['headline'] ?? ''),
        description: String(a['description'] ?? ''),
        instruction: a['instruction'] ? String(a['instruction']) : undefined,
        effectiveTime: a['effectiveTime'] ? String(a['effectiveTime']) : undefined,
        expireTime: a['expireTime'] ? String(a['expireTime']) : undefined,
        severity: a['severity'] ? String(a['severity']) : undefined,
        eventType: { name: String((a['eventType'] as Record<string, unknown> | undefined)?.['name'] ?? '') },
        color: { code: String((a['color'] as Record<string, unknown> | undefined)?.['code'] ?? '') },
      })),
    };
  }
}

class QweatherFinanceProvider implements FinanceProvider {
  constructor(private readonly client: QweatherClient) {}

  async fetchSummary(): Promise<QweatherSummary> {
    return this.client.get<QweatherSummary>('/finance/v1/summary');
  }

  async fetchStats(): Promise<QweatherStats> {
    return this.client.get<QweatherStats>('/metrics/v1/stats');
  }
}

export const QweatherProviders = [
  { provide: QWEATHER_GEO_PROVIDER, useClass: QweatherGeoProvider },
  { provide: QWEATHER_AIR_PROVIDER, useClass: QweatherAirProvider },
  { provide: QWEATHER_ALERT_PROVIDER, useClass: QweatherAlertProvider },
  { provide: QWEATHER_FINANCE_PROVIDER, useClass: QweatherFinanceProvider },
];
