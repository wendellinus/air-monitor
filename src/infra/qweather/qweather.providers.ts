import { Inject } from '@nestjs/common';
import type Redis from 'ioredis';


import { REDIS_CLIENT } from '../redis/redis.constants';

import { QweatherClient } from './qweather.client';
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

    // Matches legacy Go behavior: /geo/v2/city/lookup?location=...
    const data = await this.client.get<{
      code?: string;
      location?: Array<Record<string, unknown>>;
    }>('/geo/v2/city/lookup', { location: keyword });

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

  async fetchRealtime(lat: string, lon: string): Promise<QweatherAirRealtime> {
    const cacheKey = `qweather:air:realtime:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as QweatherAirRealtime;

    const data = await this.client.get<Record<string, unknown>>(
      `/airquality/v1/current/${lat}/${lon}`,
    );
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 60 * 45);
    return data as unknown as QweatherAirRealtime;
  }

  async fetchHourly(lat: string, lon: string): Promise<Array<Record<string, unknown>>> {
    const cacheKey = `qweather:air:hourly:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Array<Record<string, unknown>>;

    const data = await this.client.get<Record<string, unknown>>(
      `/airquality/v1/hourly/${lat}/${lon}`,
    );
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 60 * 45);
    const list = (data['hourly'] as Array<Record<string, unknown>> | undefined) ?? [];
    return list;
  }

  async fetchDaily(lat: string, lon: string): Promise<Array<Record<string, unknown>>> {
    const cacheKey = `qweather:air:daily:${lat}:${lon}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Array<Record<string, unknown>>;

    const data = await this.client.get<Record<string, unknown>>(`/airquality/v1/daily/${lat}/${lon}`);
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 60 * 60 * 10);
    const list = (data['daily'] as Array<Record<string, unknown>> | undefined) ?? [];
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

