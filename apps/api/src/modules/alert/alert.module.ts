import { Module } from '@nestjs/common';

import { CityModule } from '../city/city.module';

import { AlertController } from './alert.controller';
import { AlertService } from './alert.service';

@Module({
  imports: [CityModule],
  controllers: [AlertController],
  providers: [AlertService],
})
export class AlertModule {}

