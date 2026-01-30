import { Module } from '@nestjs/common';

import { CityController } from './city.controller';
import { CityRepository } from './city.repository';
import { CityScheduler } from './city.scheduler';
import { CityService } from './city.service';

@Module({
  controllers: [CityController],
  providers: [CityRepository, CityService, CityScheduler],
  exports: [CityRepository, CityService],
})
export class CityModule {}
