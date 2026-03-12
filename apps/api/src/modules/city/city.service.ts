import { Inject, Injectable } from '@nestjs/common';

import type { GeoProvider } from '../../infra/qweather/qweather.providers';
import { QWEATHER_GEO_PROVIDER } from '../../infra/qweather/qweather.tokens';
import type { QweatherGeoCity } from '../../infra/qweather/qweather.types';
import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';

import { CityRepository, type CityEntity } from './city.repository';

@Injectable()
export class CityService {
  constructor(
    private readonly repo: CityRepository,
    @Inject(QWEATHER_GEO_PROVIDER) private readonly geo: GeoProvider,
  ) {}

  async lookupByLocation(lon: number, lat: number): Promise<CityEntity[]> {
    const keyword = `${lon},${lat}`;
    let remote: QweatherGeoCity[];
    try {
      remote = await this.geo.fetchGeo(keyword);
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }

    const mapped = remote
      .filter((c) => c.cityId)
      .map<CityEntity>((c) => ({
        cityId: c.cityId,
        name: c.name,
        lat: c.lat,
        lon: c.lon,
        adm2: c.adm2,
        adm1: c.adm1,
        country: c.country,
      }));

    await Promise.allSettled(mapped.map((c) => this.repo.upsert(c)));
    return mapped;
  }

  async searchCity(keyword: string): Promise<CityEntity[]> {
    const db = await this.repo.searchByName(keyword);
    if (db.length > 0) return db;

    let remote: QweatherGeoCity[];
    try {
      remote = await this.geo.fetchGeo(keyword);
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }

    const mapped = remote
      .filter((c) => c.cityId)
      .map<CityEntity>((c) => ({
        cityId: c.cityId,
        name: c.name,
        lat: c.lat,
        lon: c.lon,
        adm2: c.adm2,
        adm1: c.adm1,
        country: c.country,
      }));

    // Persist searched cities so downstream air queries (which need lat/lon from DB) can work reliably.
    await Promise.allSettled(mapped.map((c) => this.repo.upsert(c)));

    return mapped;
  }

  async getTopCities(rangeType?: 'world' | 'cn' | 'us', number?: number): Promise<CityEntity[]> {
    const rt = rangeType ?? 'world';
    const n = number && number > 0 ? number : 10;

    try {
      const remote = await this.geo.getTopCities(rt, n);
      const mapped = remote.map((c) => ({
        cityId: c.cityId,
        name: c.name,
        lat: c.lat,
        lon: c.lon,
        adm2: c.adm2,
        adm1: c.adm1,
        country: c.country,
      }));

      // Persist top cities so subsequent air queries (which need lat/lon from DB) can work reliably.
      await Promise.allSettled(mapped.map((c) => this.repo.upsert(c)));

      return mapped;
    } catch (e) {
      const fallback = await this.repo.listRecent(n);
      if (fallback.length > 0) return fallback;
      throw new AppError(
        ErrorCodes.ThirdParty,
        `热门城市获取失败，请检查和风配置或稍后重试：${(e as Error).message}`,
      );
    }
  }

  async upsertCity(city: CityEntity): Promise<void> {
    await this.repo.upsert(city);
  }

  async listAdmin(
    page: number,
    pageSize: number,
    keyword?: string,
  ): Promise<{ list: CityEntity[]; total: number; page: number; pageSize: number }> {
    const currentPage = page > 0 ? page : 1;
    const currentPageSize = pageSize > 0 ? pageSize : 10;
    const { list, total } = await this.repo.listAdmin(currentPage, currentPageSize, keyword);
    return { list, total, page: currentPage, pageSize: currentPageSize };
  }
}
