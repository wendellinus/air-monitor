import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ProviderOverviewData, ProviderRefreshData } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import { type TranslateFn } from '@/ui/admin/api-quota/lib/api-quota';

type UseApiQuotaDataInput = {
  t: TranslateFn;
  enabled?: boolean;
  pollingIntervalMs?: number;
};

type UseApiQuotaDataResult = {
  overview: ProviderOverviewData | undefined;
  overviewLoading: boolean;
  refresh: () => void;
  refreshPending: boolean;
};

export function useApiQuotaData(input: UseApiQuotaDataInput): UseApiQuotaDataResult {
  const { t, enabled = true, pollingIntervalMs = 60_000 } = input;
  const queryClient = useQueryClient();

  const {
    data: overview,
    isLoading: overviewLoading,
  } = useQuery({
    queryKey: ['admin-api-quota-overview'],
    queryFn: async (): Promise<ProviderOverviewData> => {
      const response = await api.get<ApiResponse<ProviderOverviewData>>('/admin/provider-accounts/overview');
      return response.data.data;
    },
    enabled,
    refetchInterval: pollingIntervalMs,
    placeholderData: (previousData) => previousData,
  });

  const refreshMutation = useMutation({
    mutationFn: async (): Promise<ProviderRefreshData> => {
      const response = await api.post<ApiResponse<ProviderRefreshData>>('/admin/provider-accounts/refresh', {});
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data.errors.length === 0) {
        toast.success(t('admin.apiQuota.refreshSuccess'));
      } else {
        const detail = data.errors
          .map((item) => `${t(`admin.apiQuota.provider.${item.provider}`)}: ${item.message}`)
          .join('；');
        toast.warning(`${t('admin.apiQuota.refreshPartial', { count: data.errors.length })} ${detail}`);
      }
      void queryClient.invalidateQueries({ queryKey: ['admin-api-quota-overview'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-api-quota-trends'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('admin.apiQuota.refreshFail'));
    },
  });

  return {
    overview,
    overviewLoading,
    refresh: enabled ? refreshMutation.mutate : () => undefined,
    refreshPending: refreshMutation.isPending,
  };
}
