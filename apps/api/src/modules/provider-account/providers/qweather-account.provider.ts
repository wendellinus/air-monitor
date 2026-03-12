import { Injectable } from '@nestjs/common';

import { AppError } from '../../../shared/app-error';
import { ErrorCodes } from '../../../shared/error-codes';
import { ProviderService } from '../../provider/provider.service';

import { normalizeProviderNumbers } from './normalize';
import type { ProviderAccountSource, ProviderSnapshotDraft } from './types';

function toReasonMessage(input: unknown, fallback: string): string {
  if (input instanceof Error && input.message) return input.message;
  if (typeof input === 'string' && input.trim()) return input;
  return fallback;
}

function readCode(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const code = (payload as Record<string, unknown>)['code'];
  if (code === undefined || code === null) return null;
  return String(code);
}

type SeriesExtractResult = {
  total: number;
  matched: boolean;
};

function toFiniteNumber(input: unknown): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sumHourValues(input: unknown): SeriesExtractResult {
  if (Array.isArray(input)) {
    let total = 0;
    let matched = false;
    for (const point of input) {
      const direct = toFiniteNumber(point);
      if (direct !== null) {
        total += direct;
        matched = true;
        continue;
      }

      if (!point || typeof point !== 'object') continue;

      const record = point as Record<string, unknown>;
      const preferredKeys = ['value', 'count', 'requests', 'requestCount', 'total'];
      let consumed = false;
      for (const key of preferredKeys) {
        const n = toFiniteNumber(record[key]);
        if (n === null) continue;
        total += n;
        matched = true;
        consumed = true;
        break;
      }
      if (consumed) continue;

      for (const nested of Object.values(record)) {
        const n = toFiniteNumber(nested);
        if (n === null) continue;
        total += n;
        matched = true;
      }
    }
    return { total, matched };
  }

  if (input && typeof input === 'object') {
    let total = 0;
    let matched = false;
    for (const value of Object.values(input as Record<string, unknown>)) {
      const n = toFiniteNumber(value);
      if (n === null) continue;
      total += n;
      matched = true;
    }
    return { total, matched };
  }

  const n = toFiniteNumber(input);
  if (n === null) return { total: 0, matched: false };
  return { total: n, matched: true };
}

function sumHourSeries(input: unknown): SeriesExtractResult {
  if (Array.isArray(input)) {
    let total = 0;
    let matched = false;
    for (const item of input) {
      const result = sumHourSeries(item);
      total += result.total;
      matched = matched || result.matched;
    }
    return { total, matched };
  }

  if (!input || typeof input !== 'object') {
    const n = toFiniteNumber(input);
    if (n === null) return { total: 0, matched: false };
    return { total: n, matched: true };
  }

  const record = input as Record<string, unknown>;
  if ('hours' in record) {
    return sumHourValues(record['hours']);
  }

  let total = 0;
  let matched = false;
  for (const value of Object.values(record)) {
    const result = sumHourSeries(value);
    total += result.total;
    matched = matched || result.matched;
  }
  return { total, matched };
}

function extractQweatherRequestCount(stats: unknown): number | null {
  if (!stats || typeof stats !== 'object') return null;
  const record = stats as Record<string, unknown>;
  const hasSeriesField = 'success' in record || 'errors' in record;
  const success = sumHourSeries(record['success']);
  const errors = sumHourSeries(record['errors']);
  if (!success.matched && !errors.matched) {
    // New accounts often return empty arrays for stats. Treat as zero usage instead of unknown.
    return hasSeriesField ? 0 : null;
  }
  return success.total + errors.total;
}

@Injectable()
export class QweatherAccountProvider implements ProviderAccountSource {
  readonly provider = 'qweather' as const;

  constructor(private readonly providerService: ProviderService) {}

  async fetchSnapshot(): Promise<ProviderSnapshotDraft> {
    const [summaryResult, statsResult] = await Promise.allSettled([
      this.providerService.getSummary(),
      this.providerService.getStats(),
    ]);

    const summary =
      summaryResult.status === 'fulfilled'
        ? summaryResult.value
        : { error: summaryResult.reason instanceof Error ? summaryResult.reason.message : 'summary failed' };
    const stats =
      statsResult.status === 'fulfilled'
        ? statsResult.value
        : { error: statsResult.reason instanceof Error ? statsResult.reason.message : 'stats failed' };

    if (summaryResult.status !== 'fulfilled' && statsResult.status !== 'fulfilled') {
      const summaryReason = toReasonMessage(summaryResult.reason, 'summary failed');
      const statsReason = toReasonMessage(statsResult.reason, 'stats failed');
      throw new AppError(
        ErrorCodes.ThirdParty,
        `QWeather provider-account fetch failed: summary(${summaryReason}); stats(${statsReason})`,
      );
    }

    const merged = {
      summary,
      stats,
    };
    const normalized = normalizeProviderNumbers(merged);
    const fallbackRequestCount = extractQweatherRequestCount(stats);
    const requestCount = fallbackRequestCount ?? normalized.requestCount;
    const quotaUsed = normalized.quotaUsed ?? requestCount;
    const usageRate =
      normalized.usageRate === null && normalized.quotaLimit && normalized.quotaLimit > 0 && quotaUsed !== null
        ? quotaUsed / normalized.quotaLimit
        : normalized.usageRate;

    const requestCountMeta =
      fallbackRequestCount !== null
        ? {
            scope: 'today' as const,
            source: 'stats.success_errors_hours',
            note: 'aggregated from stats.success/errors.hours',
          }
        : normalized.requestCount !== null
          ? {
              scope: 'today' as const,
              source: 'normalized_fields',
              note: 'derived from summary/stats recognized fields',
            }
          : null;

    const hasAnyMetric =
      normalized.balance !== null ||
      requestCount !== null ||
      normalized.quotaLimit !== null ||
      quotaUsed !== null ||
      usageRate !== null;
    if (!hasAnyMetric) {
      const summaryCode = readCode(summary);
      const statsCode = readCode(stats);
      const codeHintParts = [
        summaryCode ? `summary.code=${summaryCode}` : '',
        statsCode ? `stats.code=${statsCode}` : '',
      ].filter(Boolean);
      const codeHint = codeHintParts.length > 0 ? ` (${codeHintParts.join(', ')})` : '';
      throw new AppError(
        ErrorCodes.ThirdParty,
        `QWeather provider-account fetch returned no usable metrics${codeHint}`,
      );
    }

    return {
      provider: this.provider,
      source: 'live',
      snapshotAt: new Date(),
      balance: normalized.balance,
      requestCount,
      quotaLimit: normalized.quotaLimit,
      quotaUsed,
      usageRate,
      requestCountMeta,
      raw: merged,
    };
  }
}
