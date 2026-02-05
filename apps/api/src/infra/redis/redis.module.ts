import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { EnvService } from '../../shared/env/env.service';

import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [EnvService],
      useFactory: (env: EnvService): Redis => {
        return new Redis(env.redisUrl, { maxRetriesPerRequest: 2 });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

