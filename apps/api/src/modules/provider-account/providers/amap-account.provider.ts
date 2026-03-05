import axios from 'axios';
import { Injectable } from '@nestjs/common';

import { EnvService } from '../../../shared/env/env.service';
import { AppError } from '../../../shared/app-error';
import { ErrorCodes } from '../../../shared/error-codes';

import { normalizeProviderNumbers } from './normalize';
import type { ProviderAccountSource, ProviderSnapshotDraft } from './types';

function buildMockSnapshot(now: Date): ProviderSnapshotDraft {
  const hourSeed = now.getUTCHours();
  const daySeed = now.getUTCDate();
  const quotaLimit = 50_000;
  const requestCount = 8_000 + daySeed * 120 + hourSeed * 38;
  const quotaUsed = Math.min(quotaLimit, requestCount + 2_000);
  const usageRate = quotaUsed / quotaLimit;

  return {
    provider: 'amap',
    source: 'mock',
    snapshotAt: now,
    balance: null,
    requestCount,
    quotaLimit,
    quotaUsed,
    usageRate,
    requestCountMeta: {
      scope: 'rolling',
      source: 'mock_formula',
      note: 'mock snapshot generated locally',
    },
    raw: {
      source: 'mock',
      generatedAt: now.toISOString(),
    },
  };
}

@Injectable()
export class AmapAccountProvider implements ProviderAccountSource {
  readonly provider = 'amap' as const;

  constructor(private readonly env: EnvService) {}

  async fetchSnapshot(): Promise<ProviderSnapshotDraft> {
    const mode = this.env.amapAccountMode;
    if (mode !== 'live') {
      return buildMockSnapshot(new Date());
    }

    if (!this.env.amapAccountApiBase) {
      throw new AppError(ErrorCodes.ThirdParty, '高德账户接口地址未配置');
    }

    const client = axios.create({
      baseURL: this.env.amapAccountApiBase,
      timeout: 15_000,
      headers: this.env.amapAccountApiKey
        ? { Authorization: `Bearer ${this.env.amapAccountApiKey}` }
        : undefined,
    });

    const [summaryRes, statsRes] = await Promise.all([
      client.get<Record<string, unknown>>('/summary'),
      client.get<Record<string, unknown>>('/stats'),
    ]);

    const merged = {
      summary: summaryRes.data,
      stats: statsRes.data,
    };
    const normalized = normalizeProviderNumbers(merged);

    return {
      provider: this.provider,
      source: 'live',
      snapshotAt: new Date(),
      balance: normalized.balance,
      requestCount: normalized.requestCount,
      quotaLimit: normalized.quotaLimit,
      quotaUsed: normalized.quotaUsed,
      usageRate: normalized.usageRate,
      requestCountMeta: {
        scope: 'rolling',
        source: 'normalized_fields',
        note: 'derived from amap summary/stats fields',
      },
      raw: merged,
    };
  }
}
