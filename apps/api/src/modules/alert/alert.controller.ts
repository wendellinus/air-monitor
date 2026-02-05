import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { WeatherAlertResponse } from '@go-practice/shared';

import { AlertService } from './alert.service';
import { CityIdQueryDto } from './dto/city-id-query.dto';

@ApiTags('alert')
@Controller('alert')
export class AlertController {
  constructor(private readonly alert: AlertService) {}

  // GET /api/v1/alert/current?city_id=...
  @Get('current')
  async current(@Query() q: CityIdQueryDto): Promise<WeatherAlertResponse> {
    return this.alert.getCurrentByCityId(q.city_id);
  }
}

