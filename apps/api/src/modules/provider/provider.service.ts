import { Inject, Injectable } from '@nestjs/common';

import type { FinanceProvider } from '../../infra/qweather/qweather.providers';
import { QWEATHER_FINANCE_PROVIDER } from '../../infra/qweather/qweather.tokens';
import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';

function assertQweatherPayloadOk(payload: Record<string, unknown>, label: 'summary' | 'stats'): void {
  if (!('code' in payload)) return;
  const code = String(payload['code'] ?? '');
  if (code === '200') return;

  const messageRaw = payload['message'];
  const message = typeof messageRaw === 'string' ? messageRaw.trim() : '';
  const detail = message ? `, message=${message}` : '';
  throw new AppError(ErrorCodes.ThirdParty, `QWeather ${label} failed: code=${code}${detail}`);
}

@Injectable()
export class ProviderService {
  constructor(@Inject(QWEATHER_FINANCE_PROVIDER) private readonly provider: FinanceProvider) {}

  async getSummary(): Promise<Record<string, unknown>> {
    try {
      const result = (await this.provider.fetchSummary()) as Record<string, unknown>;
      assertQweatherPayloadOk(result, 'summary');
      return result;
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    try {
      const result = (await this.provider.fetchStats()) as Record<string, unknown>;
      assertQweatherPayloadOk(result, 'stats');
      return result;
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }
}
