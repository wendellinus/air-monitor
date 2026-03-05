import { Module } from '@nestjs/common';

import { PermissionModule } from '../permission/permission.module';
import { ProviderModule } from '../provider/provider.module';

import { AmapAccountProvider } from './providers/amap-account.provider';
import { QweatherAccountProvider } from './providers/qweather-account.provider';
import { ProviderAccountController } from './provider-account.controller';
import { ProviderAccountRepository } from './provider-account.repository';
import { ProviderAccountScheduler } from './provider-account.scheduler';
import { ProviderAccountService } from './provider-account.service';

@Module({
  imports: [ProviderModule, PermissionModule],
  controllers: [ProviderAccountController],
  providers: [
    ProviderAccountRepository,
    ProviderAccountService,
    ProviderAccountScheduler,
    QweatherAccountProvider,
    AmapAccountProvider,
  ],
  exports: [ProviderAccountService],
})
export class ProviderAccountModule {}
