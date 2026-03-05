import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional(),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),

  QWEATHER_HOST: z.string().url().optional(),
  QWEATHER_API_KEY: z.string().optional(),
  QWEATHER_PUBLIC_ID: z.string().optional(),
  QWEATHER_PROJECT_ID: z.string().optional(),
  QWEATHER_PRIVATE_KEY_PEM: z.string().optional(),

  CACHE_REFRESH_ENABLED: z.string().optional(),
  CACHE_REFRESH_SCHEDULE: z.string().optional(),
  CACHE_REFRESH_REGIONS_JSON: z.string().optional(),

  ALERT_SYNC_ENABLED: z.string().optional(),
  ALERT_SYNC_SCHEDULE: z.string().optional(),
  ALERT_SYNC_LOCATIONS_JSON: z.string().optional(),

  PROVIDER_ACCOUNT_SYNC_ENABLED: z.string().optional(),
  PROVIDER_ACCOUNT_SYNC_SCHEDULE: z.string().optional(),
  AMAP_ACCOUNT_MODE: z.enum(['mock', 'live']).optional(),
  AMAP_ACCOUNT_API_BASE: z.string().url().optional(),
  AMAP_ACCOUNT_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

@Injectable()
export class EnvService {
  private readonly env: Env;

  constructor() {
    // Validate at boot so we fail fast with clear messages.
    this.env = envSchema.parse(process.env);
  }

  get port(): number {
    return Number(this.env.PORT ?? 8080);
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get jwtAccessSecret(): string {
    return this.env.JWT_ACCESS_SECRET;
  }

  get jwtAccessExpiresIn(): string {
    return this.env.JWT_ACCESS_EXPIRES_IN;
  }

  get jwtRefreshSecret(): string {
    return this.env.JWT_REFRESH_SECRET;
  }

  get jwtRefreshExpiresIn(): string {
    return this.env.JWT_REFRESH_EXPIRES_IN;
  }

  get qweatherHost(): string | undefined {
    return this.env.QWEATHER_HOST;
  }

  get qweatherApiKey(): string | undefined {
    return this.env.QWEATHER_API_KEY;
  }

  get qweatherPublicId(): string | undefined {
    return this.env.QWEATHER_PUBLIC_ID;
  }

  get qweatherProjectId(): string | undefined {
    return this.env.QWEATHER_PROJECT_ID;
  }

  get qweatherPrivateKeyPem(): string | undefined {
    const v = this.env.QWEATHER_PRIVATE_KEY_PEM;
    if (!v) return undefined;
    // dotenv keeps "\n" as two characters; crypto expects real newlines in PEM.
    // Support both "\n" and "\\n" encodings (we've seen both in real .env files).
    return v.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
  }

  get cacheRefreshEnabled(): boolean {
    return (this.env.CACHE_REFRESH_ENABLED ?? '').toLowerCase() === 'true';
  }

  get cacheRefreshSchedule(): string {
    return this.env.CACHE_REFRESH_SCHEDULE ?? '0 */50 * * * *';
  }

  get cacheRefreshRegionsJson(): string | undefined {
    return this.env.CACHE_REFRESH_REGIONS_JSON;
  }

  get alertSyncEnabled(): boolean {
    return (this.env.ALERT_SYNC_ENABLED ?? '').toLowerCase() === 'true';
  }

  get alertSyncSchedule(): string {
    return this.env.ALERT_SYNC_SCHEDULE ?? '0 */30 * * * *';
  }

  get alertSyncLocationsJson(): string | undefined {
    return this.env.ALERT_SYNC_LOCATIONS_JSON;
  }

  get providerAccountSyncEnabled(): boolean {
    const raw = this.env.PROVIDER_ACCOUNT_SYNC_ENABLED;
    if (raw === undefined) return true;
    return raw.toLowerCase() === 'true';
  }

  get providerAccountSyncSchedule(): string {
    return this.env.PROVIDER_ACCOUNT_SYNC_SCHEDULE ?? '0 */10 * * * *';
  }

  get amapAccountMode(): 'mock' | 'live' {
    return this.env.AMAP_ACCOUNT_MODE ?? 'mock';
  }

  get amapAccountApiBase(): string | undefined {
    return this.env.AMAP_ACCOUNT_API_BASE;
  }

  get amapAccountApiKey(): string | undefined {
    return this.env.AMAP_ACCOUNT_API_KEY;
  }
}
