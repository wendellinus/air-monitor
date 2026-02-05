
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { EnvService } from '../../shared/env/env.service';

import { NoticeService } from './notice.service';

type Location = { name: string; lat: string; lon: string };

@Injectable()
export class NoticeScheduler implements OnModuleInit {
  private readonly logger = new Logger(NoticeScheduler.name);

  constructor(
    private readonly env: EnvService,
    private readonly scheduler: SchedulerRegistry,
    private readonly notice: NoticeService,
  ) {}

  onModuleInit(): void {
    if (!this.env.alertSyncEnabled) {
      return;
    }

    const locations: Location[] = (() => {
      const raw = this.env.alertSyncLocationsJson;
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter((x): x is Location => {
            if (!x || typeof x !== 'object') return false;
            const r = x as Record<string, unknown>;
            return typeof r.name === 'string' && typeof r.lat === 'string' && typeof r.lon === 'string';
          })
          .map((x) => ({ name: x.name, lat: x.lat, lon: x.lon }));
      } catch {
        return [];
      }
    })();

    if (locations.length === 0) {
      this.logger.warn('alert sync enabled but ALERT_SYNC_LOCATIONS_JSON is empty');
      return;
    }

    const job = new CronJob(this.env.alertSyncSchedule, async () => {
      for (const loc of locations) {
        try {
          const created = await this.notice.syncWeatherAlerts(loc.lat, loc.lon);
          if (created > 0) {
            this.logger.log(`synced alerts: ${loc.name} created=${created}`);
          }
        } catch (e) {
          this.logger.warn(`sync alerts failed: ${loc.name}`, e as Error);
        }
      }
    });

    this.scheduler.addCronJob('alertSync', job);
    job.start();
    this.logger.log(`alert sync scheduled: ${this.env.alertSyncSchedule}`);
  }
}

