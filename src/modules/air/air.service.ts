import { Inject, Injectable } from '@nestjs/common';

import type { AirProvider } from '../../infra/qweather/qweather.providers';
import { QWEATHER_AIR_PROVIDER } from '../../infra/qweather/qweather.tokens';
import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';
import { CityRepository } from '../city/city.repository';

import { AirRepository, type AirQualityLogEntity } from './air.repository';

@Injectable()
export class AirService {
  constructor(
    private readonly repo: AirRepository,
    private readonly cityRepo: CityRepository,
    @Inject(QWEATHER_AIR_PROVIDER) private readonly air: AirProvider,
  ) {}

  private toLogEntity(cityId: string, raw: Record<string, unknown>): AirQualityLogEntity {
    const pubTime = new Date(String(raw['pubTime'] ?? new Date().toISOString()));
    return {
      cityId,
      pubTime,
      aqi: Number(raw['aqi'] ?? 0),
      level: String(raw['level'] ?? ''),
      category: String(raw['category'] ?? ''),
      primary: raw['primary'] ? String(raw['primary']) : undefined,
      pm10: Number(raw['pm10'] ?? 0),
      pm2p5: Number(raw['pm2p5'] ?? 0),
      no2: Number(raw['no2'] ?? 0),
      so2: Number(raw['so2'] ?? 0),
      co: Number(raw['co'] ?? 0),
      o3: Number(raw['o3'] ?? 0),
    };
  }

  async getRealtimeAqi(cityId: string): Promise<AirQualityLogEntity> {
    const city = await this.cityRepo.getByCityId(cityId);
    if (!city) {
      throw new AppError(ErrorCodes.ParamError, 'city not found');
    }

    try {
      const raw = (await this.air.fetchRealtime(city.lat, city.lon)) as unknown as Record<string, unknown>;
      const log = this.toLogEntity(cityId, raw);
      void this.repo.create(log);
      return log;
    } catch (e) {
      // Degrade to last stored value, mirroring legacy Go behavior.
      const latest = await this.repo.getLatestByCityId(cityId);
      if (latest) return latest;
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }

  async getHourlyAqi(cityId: string): Promise<Array<Record<string, unknown>>> {
    const city = await this.cityRepo.getByCityId(cityId);
    if (!city) throw new AppError(ErrorCodes.ParamError, 'city not found');
    try {
      const list = await this.air.fetchHourly(city.lat, city.lon);
      return list.map((x) => ({ ...x, cityId }));
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }

  async getDailyAqi(cityId: string): Promise<Array<Record<string, unknown>>> {
    const city = await this.cityRepo.getByCityId(cityId);
    if (!city) throw new AppError(ErrorCodes.ParamError, 'city not found');
    try {
      const list = await this.air.fetchDaily(city.lat, city.lon);
      return list.map((x) => ({ ...x, cityId }));
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }
}

