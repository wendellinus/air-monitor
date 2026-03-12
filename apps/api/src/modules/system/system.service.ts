import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { SystemRepository } from './system.repository';
import { DEFAULT_POLLING_INTERVAL_MS, MIN_POLLING_INTERVAL_MS } from './system.constants';

@Injectable()
export class SystemService implements OnModuleInit {
  private pollingInterval = DEFAULT_POLLING_INTERVAL_MS;

  constructor(@Inject(SystemRepository) private readonly repo: SystemRepository) {}

  async onModuleInit(): Promise<void> {
    const config = await this.repo.findRuntimeConfig();
    this.pollingInterval = this.normalizePollingInterval(config?.pollingInterval);
  }

  getConfig(): { pollingInterval: number } {
    return {
      pollingInterval: this.pollingInterval,
    };
  }

  async setPollingInterval(next: number): Promise<{ pollingInterval: number }> {
    const normalized = this.normalizePollingInterval(next);
    const saved = await this.repo.savePollingInterval(normalized);
    this.pollingInterval = this.normalizePollingInterval(saved.pollingInterval);
    return this.getConfig();
  }

  private normalizePollingInterval(value: number | null | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_POLLING_INTERVAL_MS;
    }
    return Math.max(MIN_POLLING_INTERVAL_MS, Math.floor(value));
  }
}
