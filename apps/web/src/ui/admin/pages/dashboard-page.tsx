import React from 'react';
import { Bell, Shield, Users, Waves, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MeResponseData, NoticeAdminListData, UserListData } from '@air-monitor/shared';

import { api } from '@/shared/api';
import type { ApiResponse } from '@/shared/types';

type MetricItem = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
};

export function AdminDashboard(): React.ReactNode {
  const [me, setMe] = React.useState<MeResponseData | null>(null);
  const [userTotal, setUserTotal] = React.useState<number | null>(null);
  const [noticeTotal, setNoticeTotal] = React.useState<number | null>(null);
  const [recentNotices, setRecentNotices] = React.useState<NoticeAdminListData['list']>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get<ApiResponse<MeResponseData>>('/user/me'),
      api.get<ApiResponse<UserListData>>('/users', { params: { page: 1, pageSize: 1 } }),
      api.get<ApiResponse<NoticeAdminListData>>('/admin/notices', { params: { page: 1, pageSize: 5 } }),
    ])
      .then(([meRes, usersRes, noticesRes]) => {
        if (!mounted) return;
        setMe(meRes.data.data);
        setUserTotal(usersRes.data.data.total);
        setNoticeTotal(noticesRes.data.data.total);
        setRecentNotices(noticesRes.data.data.list);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const metrics: MetricItem[] = [
    {
      label: 'Registered Users',
      value: loading ? '-' : String(userTotal ?? 0),
      hint: 'All users in system',
      icon: Users,
      iconClassName: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Total Notices',
      value: loading ? '-' : String(noticeTotal ?? 0),
      hint: 'Includes expired notices',
      icon: Bell,
      iconClassName: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Current Role',
      value: me?.role ?? '-',
      hint: me?.username ?? '',
      icon: Shield,
      iconClassName: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Data Refresh',
      value: 'Real-time',
      hint: 'Polling every 60s',
      icon: Waves,
      iconClassName: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Welcome back, <span className="font-medium text-slate-700">{me?.username ?? '-'}</span>
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, hint, icon: Icon, iconClassName }) => (
          <div
            key={label}
            className="group rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-800">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{hint}</p>
              </div>
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${iconClassName} shadow-sm`}
              >
                <Icon className="size-5 text-white" strokeWidth={1.8} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-800">Recent Notices</h3>
            <p className="text-xs text-slate-400">Latest 5 notice records</p>
          </div>
          <Link
            to="/admin/notices"
            className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : recentNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Bell className="mb-2 size-8 opacity-30" />
            <p className="text-sm">No notices yet</p>
          </div>
        ) : (
          <ul>
            {recentNotices.map((notice, i) => (
              <li
                key={notice.id}
                className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-slate-50 ${
                  i !== recentNotices.length - 1 ? 'border-b' : ''
                }`}
              >
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-slate-600 ring-1 ring-slate-200">
                  {notice.level}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                  {notice.title}
                </span>
                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {notice.status}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(notice.startTime).toLocaleDateString('zh-CN')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
