import { Inject, Injectable } from '@nestjs/common';

import type { FinanceProvider } from '../../infra/qweather/qweather.providers';
import { QWEATHER_FINANCE_PROVIDER } from '../../infra/qweather/qweather.tokens';
import { AppError } from '../../shared/app-error';
import { ErrorCodes } from '../../shared/error-codes';

@Injectable()
export class ProviderService {
  constructor(@Inject(QWEATHER_FINANCE_PROVIDER) private readonly provider: FinanceProvider) {}

  async getSummary(): Promise<Record<string, unknown>> {
    try {
      return (await this.provider.fetchSummary()) as Record<string, unknown>;
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }

  async getStats(): Promise<Record<string, unknown>> {
    try {
      return (await this.provider.fetchStats()) as Record<string, unknown>;
    } catch (e) {
      throw new AppError(ErrorCodes.ThirdParty, (e as Error).message);
    }
  }
}

