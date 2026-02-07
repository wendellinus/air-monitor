import { Inject, Injectable } from '@nestjs/common';

import type { WeatherAlertResponse } from '@air-monitor/shared';

import type { AlertProvider } from '../../infra/qweather/qweather.providers';
import { QWEATHER_ALERT_PROVIDER } from '../../infra/qweather/qweather.tokens';
import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';
import { CityRepository } from '../city/city.repository';

@Injectable()
export class AlertService {
  constructor(
    private readonly cityRepo: CityRepository,
    @Inject(QWEATHER_ALERT_PROVIDER) private readonly alerts: AlertProvider,
  ) {}

  async getCurrentByCityId(cityId: string): Promise<WeatherAlertResponse> {
    const city = await this.cityRepo.getByCityId(cityId);
    if (!city) throw new AppError(ErrorCodes.ParamError, 'city not found');
    try {
      return await this.alerts.fetchWeatherAlert(city.lat, city.lon);
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }
}

