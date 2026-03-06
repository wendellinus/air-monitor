import { useQuery } from '@tanstack/react-query';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';

type SystemConfig = {
  pollingInterval: number;
};

const DEFAULT_POLLING_INTERVAL_MS = 60_000;
const MIN_POLLING_INTERVAL_MS = 5_000;

function normalizeInterval(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_POLLING_INTERVAL_MS;
  return Math.max(MIN_POLLING_INTERVAL_MS, Math.floor(value));
}

type UseSystemPollingIntervalResult = {
  pollingIntervalMs: number;
  isLoading: boolean;
};

export function useSystemPollingInterval(): UseSystemPollingIntervalResult {
  const { data, isLoading } = useQuery({
    queryKey: ['system-public-config'],
    queryFn: async (): Promise<SystemConfig> => {
      const response = await api.get<ApiResponse<SystemConfig>>('/system/config');
      return response.data.data;
    },
    refetchInterval: 10_000,
    placeholderData: (previous) => previous,
  });

  return {
    pollingIntervalMs: normalizeInterval(data?.pollingInterval),
    isLoading,
  };
}
