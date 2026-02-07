import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { AirDailyItem, AirHourlyItem, AirNowItem } from '@air-monitor/shared';

import { AirService } from './air.service';
import { CityIdQueryDto } from './dto/city-id-query.dto';

@ApiTags('air')
@Controller('air')
export class AirController {
  constructor(private readonly air: AirService) {}

  // GET /api/v1/air/now?city_id=...
  @Get('now')
  async now(@Query() q: CityIdQueryDto): Promise<AirNowItem> {
    const log = await this.air.getRealtimeAqi(q.city_id);
    return {
      cityId: log.cityId,
      pubTime: log.pubTime.toISOString(),
      aqi: log.aqi,
      level: log.level,
      category: log.category,
      primary: log.primary,
      pm10: log.pm10,
      pm2p5: log.pm2p5,
      no2: log.no2,
      so2: log.so2,
      co: log.co,
      o3: log.o3,
    };
  }

  // GET /api/v1/air/hourly?city_id=...
  @Get('hourly')
  async hourly(@Query() q: CityIdQueryDto): Promise<AirHourlyItem[]> {
    return this.air.getHourlyAqi(q.city_id);
  }

  // GET /api/v1/air/daily?city_id=...
  @Get('daily')
  async daily(@Query() q: CityIdQueryDto): Promise<AirDailyItem[]> {
    return this.air.getDailyAqi(q.city_id);
  }
}
