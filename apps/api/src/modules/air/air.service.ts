import { Inject, Injectable } from '@nestjs/common';

import type { AirDailyItem, AirHourlyItem } from '@air-monitor/shared';
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

  private isEmptyLog(log: AirQualityLogEntity): boolean {
    return (
      log.aqi === 0 &&
      log.pm10 === 0 &&
      log.pm2p5 === 0 &&
      log.no2 === 0 &&
      log.so2 === 0 &&
      log.co === 0 &&
      log.o3 === 0 &&
      !log.category &&
      !log.level
    );
  }

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
      if (latest && !this.isEmptyLog(latest)) return latest;
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }

  async getHourlyAqi(cityId: string): Promise<AirHourlyItem[]> {
    const city = await this.cityRepo.getByCityId(cityId);
    if (!city) throw new AppError(ErrorCodes.ParamError, 'city not found');
    try {
      const list = await this.air.fetchHourly(city.lat, city.lon);
      return list.map((x) => ({ ...x, cityId })) as AirHourlyItem[];
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }

  async getDailyAqi(cityId: string): Promise<AirDailyItem[]> {
    const city = await this.cityRepo.getByCityId(cityId);
    if (!city) throw new AppError(ErrorCodes.ParamError, 'city not found');
    try {
      const list = await this.air.fetchDaily(city.lat, city.lon);
      return list.map((x) => ({ ...x, cityId })) as AirDailyItem[];
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }
}
