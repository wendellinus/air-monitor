import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import type { CityItem } from '@go-practice/shared';

import { CityService } from './city.service';
import { LookupCityQueryDto } from './dto/lookup-city-query.dto';
import { SearchCityQueryDto } from './dto/search-city-query.dto';
import { TopCitiesQueryDto } from './dto/top-cities-query.dto';

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private readonly city: CityService) {}

  // GET /api/v1/city/search?keyword=...
  @Get('search')
  async search(@Query() q: SearchCityQueryDto): Promise<CityItem[]> {
    return this.city.searchCity(q.keyword);
  }

  // GET /api/v1/city/lookup?lon=...&lat=...
  @Get('lookup')
  async lookup(@Query() q: LookupCityQueryDto): Promise<CityItem[]> {
    return this.city.lookupByLocation(q.lon, q.lat);
  }

  // GET /api/v1/city/top?rangeType=cn&number=20
  @Get('top')
  async top(@Query() q: TopCitiesQueryDto): Promise<CityItem[]> {
    return this.city.getTopCities(q.rangeType, q.number);
  }
}
