import React from 'react';
import { toast } from 'sonner';
import type {
  AirNowItem,
  CityItem,
  MeResponseData,
  NoticeAdminListData,
  ProviderOverviewData,
  UserListData,
  WeatherAlertResponse,
} from '@air-monitor/shared';

import { api } from '@/shared/api';
import { SILENT_UI_ERROR_REQUEST_CONFIG } from '@/shared/http/api-request-config';
import type { ApiResponse } from '@/shared/types';
import { textByLocale } from '@/ui/admin/dashboard/lib/layout';

export type DashboardCitySpotlightItem = {
  cityId: string;
  name: string;
  aqi: number | null;
  alertCount: number;
  primary: string | null;
};

type DashboardSpotlightData = {
  averageAqi: number | null;
  alertCityCount: number;
  cleanestCities: DashboardCitySpotlightItem[];
  riskiestCities: DashboardCitySpotlightItem[];
};

type DashboardCoreData = {
  me: MeResponseData | null;
  userTotal: number | null;
  noticeTotal: number | null;
  recentNotices: NoticeAdminListData['list'];
  noticeSample: NoticeAdminListData['list'];
  providerOverview: ProviderOverviewData | null;
  spotlight: DashboardSpotlightData;
  loading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

const EMPTY_SPOTLIGHT: DashboardSpotlightData = {
  averageAqi: null,
  alertCityCount: 0,
  cleanestCities: [],
  riskiestCities: [],
};

async function loadSpotlightData(): Promise<DashboardSpotlightData> {
  const topCitiesResponse = await api.get<ApiResponse<CityItem[]>>('/city/top', {
    ...SILENT_UI_ERROR_REQUEST_CONFIG,
    params: { rangeType: 'cn', number: 6 },
  });

  const topCities = Array.isArray(topCitiesResponse.data.data) ? topCitiesResponse.data.data : [];
  if (topCities.length === 0) return EMPTY_SPOTLIGHT;

  const snapshots = await Promise.all(
    topCities.map(async (city: CityItem): Promise<DashboardCitySpotlightItem> => {
      let air: AirNowItem | null = null;
      let alerts: WeatherAlertResponse | null = null;

      try {
        const airResponse = await api.get<ApiResponse<AirNowItem>>('/air/now', {
          ...SILENT_UI_ERROR_REQUEST_CONFIG,
          params: { city_id: city.cityId },
        });
        air = airResponse.data.data;
      } catch {
        air = null;
      }

      try {
        const alertsResponse = await api.get<ApiResponse<WeatherAlertResponse>>('/alert/current', {
          ...SILENT_UI_ERROR_REQUEST_CONFIG,
          params: { city_id: city.cityId },
        });
        alerts = alertsResponse.data.data;
      } catch {
        alerts = null;
      }

      return {
        cityId: city.cityId,
        name: city.name,
        aqi: air?.aqi ?? null,
        alertCount: alerts?.alerts.length ?? 0,
        primary: air?.primary ?? null,
      };
    }),
  );

  const validAqi = snapshots
    .map((item) => item.aqi)
    .filter((value): value is number => typeof value === 'number');

  return {
    averageAqi:
      validAqi.length > 0
        ? Math.round(validAqi.reduce((sum: number, value: number) => sum + value, 0) / validAqi.length)
        : null,
    alertCityCount: snapshots.filter((item) => item.alertCount > 0).length,
    cleanestCities: [...snapshots]
      .filter((item) => item.aqi !== null)
      .sort((a, b) => (a.aqi ?? 999) - (b.aqi ?? 999))
      .slice(0, 3),
    riskiestCities: [...snapshots]
      .filter((item) => item.aqi !== null)
      .sort((a, b) => (b.alertCount - a.alertCount) || ((b.aqi ?? 0) - (a.aqi ?? 0)))
      .slice(0, 3),
  };
}

export function useDashboardCoreData(locale: string): DashboardCoreData {
  const [me, setMe] = React.useState<MeResponseData | null>(null);
  const [userTotal, setUserTotal] = React.useState<number | null>(null);
  const [noticeTotal, setNoticeTotal] = React.useState<number | null>(null);
  const [recentNotices, setRecentNotices] = React.useState<NoticeAdminListData['list']>([]);
  const [noticeSample, setNoticeSample] = React.useState<NoticeAdminListData['list']>([]);
  const [providerOverview, setProviderOverview] = React.useState<ProviderOverviewData | null>(null);
  const [spotlight, setSpotlight] = React.useState<DashboardSpotlightData>(EMPTY_SPOTLIGHT);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const syncCoreData = React.useCallback(async (): Promise<number> => {
    const [meRes, usersRes, noticesRes, providerRes, spotlightRes] = await Promise.allSettled([
      api.get<ApiResponse<MeResponseData>>('/user/me'),
      api.get<ApiResponse<UserListData>>('/users', { params: { page: 1, pageSize: 1 } }),
      api.get<ApiResponse<NoticeAdminListData>>('/admin/notices', { params: { page: 1, pageSize: 50 } }),
      api.get<ApiResponse<ProviderOverviewData>>('/admin/provider-accounts/overview'),
      loadSpotlightData(),
    ]);

    if (meRes.status === 'fulfilled') setMe(meRes.value.data.data);
    if (usersRes.status === 'fulfilled') setUserTotal(usersRes.value.data.data.total);
    if (noticesRes.status === 'fulfilled') {
      setNoticeTotal(noticesRes.value.data.data.total);
      setRecentNotices(noticesRes.value.data.data.list.slice(0, 5));
      setNoticeSample(noticesRes.value.data.data.list);
    }
    if (providerRes.status === 'fulfilled') setProviderOverview(providerRes.value.data.data);
    if (spotlightRes.status === 'fulfilled') setSpotlight(spotlightRes.value);

    return [meRes, usersRes, noticesRes, providerRes, spotlightRes].filter(
      (item) => item.status === 'rejected',
    ).length;
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      await syncCoreData();
      if (mounted) setLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [syncCoreData]);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const failedCount = await syncCoreData();

    if (failedCount > 0) {
      toast.error(
        textByLocale(
          locale,
          `刷新完成，但有 ${failedCount} 个模块更新失败`,
          `Refresh completed with ${failedCount} failed module(s)`,
        ),
      );
    } else {
      toast.success(textByLocale(locale, '首页数据已刷新', 'Dashboard data refreshed'));
    }

    setLoading(false);
    setIsRefreshing(false);
  }, [isRefreshing, locale, syncCoreData]);

  return {
    me,
    userTotal,
    noticeTotal,
    recentNotices,
    noticeSample,
    providerOverview,
    spotlight,
    loading,
    isRefreshing,
    refresh,
  };
}
