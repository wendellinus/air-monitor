import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './infra/prisma/prisma.module';
import { QweatherModule } from './infra/qweather/qweather.module';
import { RedisModule } from './infra/redis/redis.module';
import { AirModule } from './modules/air/air.module';
import { AlertModule } from './modules/alert/alert.module';
import { AuthModule } from './modules/auth/auth.module';
import { CityModule } from './modules/city/city.module';
import { NoticeModule } from './modules/notice/notice.module';
import { PermissionModule } from './modules/permission/permission.module';
import { ProviderModule } from './modules/provider/provider.module';
import { ProviderAccountModule } from './modules/provider-account/provider-account.module';
import { UserModule } from './modules/user/user.module';
import { WsModule } from './modules/ws/ws.module';
import { SystemModule } from './modules/system/system.module';
import { EnvModule } from './shared/env/env.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '.env'), join(process.cwd(), '..', '..', '.env')],
    }),
    EnvModule,
    PrismaModule,
    RedisModule,
    QweatherModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    CityModule,
    AirModule,
    AlertModule,
    NoticeModule,
    PermissionModule,
    ProviderModule,
    ProviderAccountModule,
    WsModule,
    SystemModule,
  ],
})
export class AppModule {}
