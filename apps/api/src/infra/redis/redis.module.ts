import { Global, Logger, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { EnvService } from '../../shared/env/env.service';

import { REDIS_CLIENT } from './redis.constants';

const redisLogger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [EnvService],
      useFactory: (env: EnvService): Redis => {
        const client = new Redis(env.redisUrl, {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });

        let logged = false;
        client.on('error', (error: Error) => {
          if (logged) return;
          logged = true;
          redisLogger.warn(
            `Redis unavailable at ${env.redisUrl}. Cache, token blacklist, and related features will fail until Redis is up. ${error.message}`,
          );
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
