import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';

export type AirQualityLogEntity = {
  cityId: string;
  pubTime: Date;
  aqi: number;
  level: string;
  category: string;
  primary?: string;
  pm10: number;
  pm2p5: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
};

@Injectable()
export class AirRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(log: AirQualityLogEntity): Promise<void> {
    await this.prisma.airQualityLog.create({
      data: {
        cityId: log.cityId,
        pubTime: log.pubTime,
        aqi: log.aqi,
        level: log.level,
        category: log.category,
        primary: log.primary ?? null,
        pm10: log.pm10,
        pm2p5: log.pm2p5,
        no2: log.no2,
        so2: log.so2,
        co: log.co,
        o3: log.o3,
      },
    });
  }

  async getLatestByCityId(cityId: string): Promise<AirQualityLogEntity | null> {
    const row = await this.prisma.airQualityLog.findFirst({
      where: { cityId },
      orderBy: { pubTime: 'desc' },
      select: {
        cityId: true,
        pubTime: true,
        aqi: true,
        level: true,
        category: true,
        primary: true,
        pm10: true,
        pm2p5: true,
        no2: true,
        so2: true,
        co: true,
        o3: true,
      },
    });
    if (!row) return null;
    return {
      cityId: row.cityId,
      pubTime: row.pubTime,
      aqi: row.aqi,
      level: row.level,
      category: row.category,
      primary: row.primary ?? undefined,
      pm10: row.pm10,
      pm2p5: row.pm2p5,
      no2: row.no2,
      so2: row.so2,
      co: row.co,
      o3: row.o3,
    };
  }
}

