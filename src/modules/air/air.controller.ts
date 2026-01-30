import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AirService } from './air.service';
import { CityIdQueryDto } from './dto/city-id-query.dto';

@ApiTags('air')
@Controller('air')
export class AirController {
  constructor(private readonly air: AirService) {}

  // GET /api/v1/air/now?city_id=...
  @Get('now')
  async now(@Query() q: CityIdQueryDto): Promise<unknown> {
    return this.air.getRealtimeAqi(q.city_id);
  }

  // GET /api/v1/air/hourly?city_id=...
  @Get('hourly')
  async hourly(@Query() q: CityIdQueryDto): Promise<unknown> {
    return this.air.getHourlyAqi(q.city_id);
  }

  // GET /api/v1/air/daily?city_id=...
  @Get('daily')
  async daily(@Query() q: CityIdQueryDto): Promise<unknown> {
    return this.air.getDailyAqi(q.city_id);
  }
}

