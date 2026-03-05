import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { EnvService } from '../../shared/env/env.service';

import { ProviderAccountService } from './provider-account.service';

@Injectable()
export class ProviderAccountScheduler implements OnModuleInit {
  private readonly logger = new Logger(ProviderAccountScheduler.name);

  constructor(
    private readonly env: EnvService,
    private readonly scheduler: SchedulerRegistry,
    private readonly account: ProviderAccountService,
  ) {}

  onModuleInit(): void {
    if (!this.env.providerAccountSyncEnabled) {
      return;
    }

    const job = new CronJob(this.env.providerAccountSyncSchedule, async () => {
      try {
        await this.account.syncProviders();
      } catch (error) {
        this.logger.warn('provider account sync failed', error as Error);
      }
    });

    this.scheduler.addCronJob('providerAccountSync', job);
    job.start();
    this.logger.log(`provider account sync scheduled: ${this.env.providerAccountSyncSchedule}`);
  }
}
