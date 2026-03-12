import type { ProviderService } from '../../provider/provider.service';

import { QweatherAccountProvider } from './qweather-account.provider';

type ProviderServiceMock = jest.Mocked<Pick<ProviderService, 'getSummary' | 'getStats'>>;

function createProviderServiceMock(): ProviderServiceMock {
  return {
    getSummary: jest.fn<Promise<Record<string, unknown>>, []>(),
    getStats: jest.fn<Promise<Record<string, unknown>>, []>(),
  };
}

describe('QweatherAccountProvider', () => {
  it('extracts requestCount from stats.success/errors hours arrays', async () => {
    const service = createProviderServiceMock();
    service.getSummary.mockResolvedValue({ balance: 0 });
    service.getStats.mockResolvedValue({
      success: [{ hours: [10, 20, '30'] }],
      errors: [{ hours: [1, '2'] }],
    });

    const provider = new QweatherAccountProvider(service as unknown as ProviderService);
    const snapshot = await provider.fetchSnapshot();

    expect(snapshot.requestCount).toBe(63);
    expect(snapshot.quotaUsed).toBe(63);
    expect(snapshot.balance).toBe(0);
  });

  it('keeps zero as a valid requestCount instead of null', async () => {
    const service = createProviderServiceMock();
    service.getSummary.mockResolvedValue({ balance: 0 });
    service.getStats.mockResolvedValue({
      success: [{ hours: [0, 0] }],
      errors: [{ hours: [0] }],
    });

    const provider = new QweatherAccountProvider(service as unknown as ProviderService);
    const snapshot = await provider.fetchSnapshot();

    expect(snapshot.requestCount).toBe(0);
    expect(snapshot.quotaUsed).toBe(0);
  });

  it('throws when qweather returns only code with no usable metrics', async () => {
    const service = createProviderServiceMock();
    service.getSummary.mockResolvedValue({ code: '200' });
    service.getStats.mockResolvedValue({ code: '200' });

    const provider = new QweatherAccountProvider(service as unknown as ProviderService);

    await expect(provider.fetchSnapshot()).rejects.toThrow('no usable metrics');
  });

  it('prefers stats hourly aggregation when normalized request count conflicts', async () => {
    const service = createProviderServiceMock();
    service.getSummary.mockResolvedValue({ requestCount: 2, balance: 0 });
    service.getStats.mockResolvedValue({
      success: [{ hours: [10, 5] }],
      errors: [{ hours: [3] }],
    });

    const provider = new QweatherAccountProvider(service as unknown as ProviderService);
    const snapshot = await provider.fetchSnapshot();

    expect(snapshot.requestCount).toBe(18);
    expect(snapshot.requestCountMeta).toEqual(
      expect.objectContaining({
        scope: 'today',
        source: 'stats.success_errors_hours',
      }),
    );
  });
});
