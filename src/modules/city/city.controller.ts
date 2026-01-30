import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CityService } from './city.service';
import { SearchCityQueryDto } from './dto/search-city-query.dto';
import { TopCitiesQueryDto } from './dto/top-cities-query.dto';

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private readonly city: CityService) {}

  // GET /api/v1/city/search?keyword=...
  @Get('search')
  async search(@Query() q: SearchCityQueryDto): Promise<unknown> {
    return this.city.searchCity(q.keyword);
  }

  // GET /api/v1/city/top?rangeType=cn&number=20
  @Get('top')
  async top(@Query() q: TopCitiesQueryDto): Promise<unknown> {
    return this.city.getTopCities(q.rangeType, q.number);
  }
}

