import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { Test, type TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import type {
  AirProvider,
  AlertProvider,
  FinanceProvider,
  GeoProvider,
} from '../src/infra/qweather/qweather.providers';
import {
  QWEATHER_AIR_PROVIDER,
  QWEATHER_ALERT_PROVIDER,
  QWEATHER_FINANCE_PROVIDER,
  QWEATHER_GEO_PROVIDER,
} from '../src/infra/qweather/qweather.tokens';
import { REDIS_CLIENT } from '../src/infra/redis/redis.constants';
import { HttpExceptionFilter } from '../src/shared/http-exception.filter';
import { ResponseInterceptor } from '../src/shared/response.interceptor';

type RedisValue = { v: string; expMs?: number };

class MemoryRedis {
  private readonly store = new Map<string, RedisValue>();

  async get(key: string): Promise<string | null> {
    const found = this.store.get(key);
    if (!found) return null;
    if (found.expMs && Date.now() >= found.expMs) {
      this.store.delete(key);
      return null;
    }
    return found.v;
  }

  // Support the subset we use in the app: set(key, val, 'EX', ttlSec)
  async set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    if (mode === 'EX' && typeof ttl === 'number') {
      this.store.set(key, { v: value, expMs: Date.now() + ttl * 1000 });
    } else {
      this.store.set(key, { v: value });
    }
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
}

export type TestApp = {
  app: INestApplication;
  moduleRef: TestingModule;
  prisma: PrismaService;
  redis: MemoryRedis;
};

export async function createTestApp(): Promise<TestApp> {
  const redis = new MemoryRedis();

  const fakeGeo: GeoProvider = {
    async fetchGeo(keyword: string) {
      return [
        {
          cityId: '101010100',
          name: keyword,
          lat: '39.9042',
          lon: '116.4074',
          adm2: '北京',
          adm1: '北京',
          country: '中国',
        },
      ];
    },
    async getTopCities(_rangeType, number: number) {
      const n = number > 0 ? number : 10;
      return Array.from({ length: n }).map((_, i) => ({
        cityId: String(101010100 + i),
        name: `城市${i + 1}`,
        lat: '39.9042',
        lon: '116.4074',
        adm2: '北京',
        adm1: '北京',
        country: '中国',
      }));
    },
  };

  const fakeAir: AirProvider = {
    async fetchRealtime(lat: string, lon: string) {
      void lat;
      void lon;
      return {
        pubTime: new Date().toISOString(),
        aqi: 60,
        level: '2',
        category: '良',
        primary: 'PM2.5',
        pm10: 30,
        pm2p5: 20,
        no2: 10,
        so2: 2,
        co: 0.6,
        o3: 50,
      };
    },
    async fetchHourly(lat: string, lon: string) {
      void lat;
      void lon;
      return [{ fxTime: new Date().toISOString(), aqi: 60 }];
    },
    async fetchDaily(lat: string, lon: string) {
      void lat;
      void lon;
      return [{ fxDate: new Date().toISOString().slice(0, 10), aqi: 60 }];
    },
  };

  const fakeAlert: AlertProvider = {
    async fetchWeatherAlert(lat: string, lon: string) {
      void lat;
      void lon;
      return { zeroResult: true, alerts: [] };
    },
  };

  const fakeFinance: FinanceProvider = {
    async fetchSummary() {
      return { code: '200' };
    },
    async fetchStats() {
      return { code: '200' };
    },
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(REDIS_CLIENT)
    .useValue(redis)
    .overrideProvider(QWEATHER_GEO_PROVIDER)
    .useValue(fakeGeo)
    .overrideProvider(QWEATHER_AIR_PROVIDER)
    .useValue(fakeAir)
    .overrideProvider(QWEATHER_ALERT_PROVIDER)
    .useValue(fakeAlert)
    .overrideProvider(QWEATHER_FINANCE_PROVIDER)
    .useValue(fakeFinance)
    .compile();

  const app = moduleRef.createNestApplication();

  // Mirror main.ts so e2e tests exercise the same global behavior.
  app.setGlobalPrefix('api/v1');
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  return {
    app,
    moduleRef,
    prisma: app.get(PrismaService),
    redis,
  };
}
