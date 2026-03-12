import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';

export type CityEntity = {
  cityId: string;
  name: string;
  lat: string;
  lon: string;
  adm2: string;
  adm1: string;
  country: string;
};

@Injectable()
export class CityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getByCityId(cityId: string): Promise<CityEntity | null> {
    return this.prisma.city.findUnique({
      where: { cityId },
      select: { cityId: true, name: true, lat: true, lon: true, adm2: true, adm1: true, country: true },
    });
  }

  async searchByName(keyword: string): Promise<CityEntity[]> {
    return this.prisma.city.findMany({
      where: { name: { contains: keyword, mode: 'insensitive' } },
      take: 20,
      select: { cityId: true, name: true, lat: true, lon: true, adm2: true, adm1: true, country: true },
    });
  }

  async listRecent(limit: number): Promise<CityEntity[]> {
    return this.prisma.city.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: { cityId: true, name: true, lat: true, lon: true, adm2: true, adm1: true, country: true },
    });
  }

  async listAdmin(
    page: number,
    pageSize: number,
    keyword?: string,
  ): Promise<{ list: CityEntity[]; total: number }> {
    const normalizedKeyword = keyword?.trim();
    const where = normalizedKeyword
      ? {
          OR: [
            { name: { contains: normalizedKeyword, mode: 'insensitive' as const } },
            { adm1: { contains: normalizedKeyword, mode: 'insensitive' as const } },
            { adm2: { contains: normalizedKeyword, mode: 'insensitive' as const } },
            { country: { contains: normalizedKeyword, mode: 'insensitive' as const } },
            { cityId: { contains: normalizedKeyword } },
          ],
        }
      : undefined;

    const [total, list] = await this.prisma.$transaction([
      this.prisma.city.count({ where }),
      this.prisma.city.findMany({
        where,
        orderBy: { cityId: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { cityId: true, name: true, lat: true, lon: true, adm2: true, adm1: true, country: true },
      }),
    ]);

    return { total, list };
  }

  async upsert(city: CityEntity): Promise<void> {
    await this.prisma.city.upsert({
      where: { cityId: city.cityId },
      update: {
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        adm2: city.adm2,
        adm1: city.adm1,
        country: city.country,
      },
      create: {
        cityId: city.cityId,
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        adm2: city.adm2,
        adm1: city.adm1,
        country: city.country,
      },
    });
  }
}
