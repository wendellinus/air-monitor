
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { EnvService } from '../../shared/env/env.service';

import { CityService } from './city.service';

type Region = { name: 'cn' | 'world' | 'us'; count: number };

@Injectable()
export class CityScheduler implements OnModuleInit {
  private readonly logger = new Logger(CityScheduler.name);

  constructor(
    private readonly env: EnvService,
    private readonly scheduler: SchedulerRegistry,
    private readonly city: CityService,
  ) {}

  onModuleInit(): void {
    if (!this.env.cacheRefreshEnabled) {
      return;
    }

    const regions: Region[] = (() => {
      const raw = this.env.cacheRefreshRegionsJson;
      if (!raw) return [{ name: 'cn', count: 20 }, { name: 'world', count: 10 }];
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [{ name: 'cn', count: 20 }, { name: 'world', count: 10 }];
        return parsed
          .filter((x): x is Region => {
            if (!x || typeof x !== 'object') return false;
            const r = x as Record<string, unknown>;
            return (
              (r.name === 'cn' || r.name === 'world' || r.name === 'us') &&
              typeof r.count === 'number' &&
              r.count > 0
            );
          })
          .map((x) => ({ name: x.name, count: x.count }));
      } catch {
        return [{ name: 'cn', count: 20 }, { name: 'world', count: 10 }];
      }
    })();

    const job = new CronJob(this.env.cacheRefreshSchedule, async () => {
      for (const region of regions) {
        try {
          await this.city.getTopCities(region.name, region.count);
        } catch (e) {
          this.logger.warn(`refresh top cities failed: region=${region.name}`, e as Error);
        }
      }
    });

    this.scheduler.addCronJob('cacheRefreshTopCities', job);
    job.start();
    this.logger.log(`cache refresh scheduled: ${this.env.cacheRefreshSchedule}`);
  }
}

