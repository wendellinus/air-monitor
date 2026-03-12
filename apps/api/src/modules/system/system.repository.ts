import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { SYSTEM_RUNTIME_CONFIG_ID } from './system.constants';

@Injectable()
export class SystemRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findRuntimeConfig(): Promise<{ pollingInterval: number } | null> {
    return this.prisma.systemRuntimeConfig.findUnique({
      where: { id: SYSTEM_RUNTIME_CONFIG_ID },
      select: { pollingInterval: true },
    });
  }

  async savePollingInterval(pollingInterval: number): Promise<{ pollingInterval: number }> {
    return this.prisma.systemRuntimeConfig.upsert({
      where: { id: SYSTEM_RUNTIME_CONFIG_ID },
      create: {
        id: SYSTEM_RUNTIME_CONFIG_ID,
        pollingInterval,
      },
      update: {
        pollingInterval,
      },
      select: { pollingInterval: true },
    });
  }
}
