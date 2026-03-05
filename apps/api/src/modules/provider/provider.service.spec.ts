import type { FinanceProvider } from '../../infra/qweather/qweather.providers';
import { AppError } from '../../shared/app-error';

import { ProviderService } from './provider.service';

function createProviderMock(): jest.Mocked<FinanceProvider> {
  return {
    fetchSummary: jest.fn<Promise<Record<string, unknown>>, []>(),
    fetchStats: jest.fn<Promise<Record<string, unknown>>, []>(),
  };
}

describe('ProviderService', () => {
  it('returns summary when qweather business code is 200', async () => {
    const provider = createProviderMock();
    provider.fetchSummary.mockResolvedValue({ code: '200', balance: 12.3 });

    const service = new ProviderService(provider);
    const result = await service.getSummary();

    expect(result).toEqual({ code: '200', balance: 12.3 });
  });

  it('throws AppError when summary business code is non-200', async () => {
    const provider = createProviderMock();
    provider.fetchSummary.mockResolvedValue({ code: '401', message: 'auth failed' });

    const service = new ProviderService(provider);

    await expect(service.getSummary()).rejects.toBeInstanceOf(AppError);
    await expect(service.getSummary()).rejects.toThrow('code=401');
  });
});
