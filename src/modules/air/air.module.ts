import { Module } from '@nestjs/common';

import { CityModule } from '../city/city.module';

import { AirController } from './air.controller';
import { AirRepository } from './air.repository';
import { AirService } from './air.service';

@Module({
  imports: [CityModule],
  controllers: [AirController],
  providers: [AirRepository, AirService],
})
export class AirModule {}
