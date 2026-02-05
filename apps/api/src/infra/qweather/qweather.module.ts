import { Global, Module } from '@nestjs/common';

import { QweatherClient } from './qweather.client';
import { QweatherProviders } from './qweather.providers';

@Global()
@Module({
  providers: [QweatherClient, ...QweatherProviders],
  exports: [QweatherClient, ...QweatherProviders],
})
export class QweatherModule {}

