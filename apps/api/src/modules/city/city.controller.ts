import type { AdminCityListData, CityItem } from '@air-monitor/shared';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Permissions } from '../../shared/authz/permissions.decorator';
import { PermissionsGuard } from '../../shared/authz/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CityService } from './city.service';
import { AdminCityListQueryDto } from './dto/admin-city-list-query.dto';
import { LookupCityQueryDto } from './dto/lookup-city-query.dto';
import { SearchCityQueryDto } from './dto/search-city-query.dto';
import { TopCitiesQueryDto } from './dto/top-cities-query.dto';

@ApiTags('city')
@Controller('city')
export class CityController {
  constructor(private readonly city: CityService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('cities.view')
  @Get('/admin/list')
  async adminList(@Query() q: AdminCityListQueryDto): Promise<AdminCityListData> {
    const { list, total, page, pageSize } = await this.city.listAdmin(q.page ?? 1, q.pageSize ?? 10, q.keyword);
    return { list, total, page, pageSize };
  }

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
