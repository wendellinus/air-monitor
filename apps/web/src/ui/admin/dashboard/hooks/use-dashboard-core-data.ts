import React from 'react';
import { toast } from 'sonner';
import type {
  MeResponseData,
  NoticeAdminListData,
  ProviderOverviewData,
  UserListData,
} from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import { textByLocale } from '@/ui/admin/dashboard/lib/layout';

type DashboardCoreData = {
  me: MeResponseData | null;
  userTotal: number | null;
  noticeTotal: number | null;
  recentNotices: NoticeAdminListData['list'];
  noticeSample: NoticeAdminListData['list'];
  providerOverview: ProviderOverviewData | null;
  loading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

export function useDashboardCoreData(locale: string): DashboardCoreData {
  const [me, setMe] = React.useState<MeResponseData | null>(null);
  const [userTotal, setUserTotal] = React.useState<number | null>(null);
  const [noticeTotal, setNoticeTotal] = React.useState<number | null>(null);
  const [recentNotices, setRecentNotices] = React.useState<NoticeAdminListData['list']>([]);
  const [noticeSample, setNoticeSample] = React.useState<NoticeAdminListData['list']>([]);
  const [providerOverview, setProviderOverview] = React.useState<ProviderOverviewData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadCoreData = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    const [meRes, usersRes, noticesRes, providerRes] = await Promise.allSettled([
      api.get<ApiResponse<MeResponseData>>('/user/me'),
      api.get<ApiResponse<UserListData>>('/users', { params: { page: 1, pageSize: 1 } }),
      api.get<ApiResponse<NoticeAdminListData>>('/admin/notices', { params: { page: 1, pageSize: 50 } }),
      api.get<ApiResponse<ProviderOverviewData>>('/admin/provider-accounts/overview'),
    ]);

    if (meRes.status === 'fulfilled') setMe(meRes.value.data.data);
    if (usersRes.status === 'fulfilled') setUserTotal(usersRes.value.data.data.total);
    if (noticesRes.status === 'fulfilled') {
      setNoticeTotal(noticesRes.value.data.data.total);
      setRecentNotices(noticesRes.value.data.data.list.slice(0, 5));
      setNoticeSample(noticesRes.value.data.data.list);
    }
    if (providerRes.status === 'fulfilled') setProviderOverview(providerRes.value.data.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadCoreData();
  }, [loadCoreData]);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    const [meRes, usersRes, noticesRes, providerRes] = await Promise.allSettled([
      api.get<ApiResponse<MeResponseData>>('/user/me'),
      api.get<ApiResponse<UserListData>>('/users', { params: { page: 1, pageSize: 1 } }),
      api.get<ApiResponse<NoticeAdminListData>>('/admin/notices', { params: { page: 1, pageSize: 50 } }),
      api.get<ApiResponse<ProviderOverviewData>>('/admin/provider-accounts/overview'),
    ]);

    if (meRes.status === 'fulfilled') setMe(meRes.value.data.data);
    if (usersRes.status === 'fulfilled') setUserTotal(usersRes.value.data.data.total);
    if (noticesRes.status === 'fulfilled') {
      setNoticeTotal(noticesRes.value.data.data.total);
      setRecentNotices(noticesRes.value.data.data.list.slice(0, 5));
      setNoticeSample(noticesRes.value.data.data.list);
    }
    if (providerRes.status === 'fulfilled') setProviderOverview(providerRes.value.data.data);

    const failedCount = [meRes, usersRes, noticesRes, providerRes].filter(
      (item) => item.status === 'rejected',
    ).length;

    if (failedCount > 0) {
      toast.error(
        textByLocale(
          locale,
          `刷新完成，但有 ${failedCount} 个模块更新失败`,
          `Refresh completed with ${failedCount} failed module(s)`,
        ),
      );
    } else {
      toast.success(textByLocale(locale, '仪表盘数据已刷新', 'Dashboard data refreshed'));
    }

    setLoading(false);
    setIsRefreshing(false);
  }, [isRefreshing, locale]);

  return {
    me,
    userTotal,
    noticeTotal,
    recentNotices,
    noticeSample,
    providerOverview,
    loading,
    isRefreshing,
    refresh,
  };
}
