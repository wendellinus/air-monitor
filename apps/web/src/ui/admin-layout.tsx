import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Bell, FolderKanban, LogOut, Settings, ShieldCheck, User } from 'lucide-react';

import type { MeResponseData } from '@air-monitor/shared';

import { api } from '../shared/api';
import { clearTokens } from '../shared/auth';
import type { ApiResponse } from '../shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type MetricItem = {
  label: string;
  value: string;
  hint: string;
};

const metricItems: MetricItem[] = [
  { label: '在线城市', value: '32', hint: '较昨日 +3' },
  { label: '告警条目', value: '8', hint: '待处理 3 项' },
  { label: '订阅用户', value: '1,286', hint: '本周新增 46' },
  { label: '数据更新', value: '99.8%', hint: '过去 24 小时' },
];

const recentRows: Array<{ id: string; event: string; level: string; time: string }> = [
  { id: 'AL-1024', event: '北京 PM2.5 触发提醒', level: '中', time: '10:32' },
  { id: 'AL-1023', event: '上海空气质量恢复正常', level: '低', time: '09:56' },
  { id: 'AL-1022', event: '广州风向变化预警', level: '中', time: '09:20' },
  { id: 'AL-1021', event: '成都高温复合污染提示', level: '高', time: '08:41' },
  { id: 'AL-1020', event: '深圳湿度异常波动', level: '低', time: '08:05' },
];

export function AdminLayout(): React.ReactNode {
  const nav = useNavigate();
  const [me, setMe] = React.useState<MeResponseData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await api.get<ApiResponse<MeResponseData>>('/user/me');
        if (mounted) {
          setMe(response.data.data);
        }
      } catch (errorValue) {
        if (mounted) {
          setError(errorValue instanceof Error ? errorValue.message : '加载用户信息失败');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function logout(): Promise<void> {
    try {
      await api.post('/logout');
    } catch {
      // noop
    } finally {
      clearTokens();
      nav('/admin/login', { replace: true });
    }
  }

  return (
    <div className="admin-theme bg-background text-foreground min-h-svh">
      <div className="grid min-h-svh lg:grid-cols-[15rem_1fr]">
        <aside className="bg-[var(--sidebar)] border-sidebar-border border-r">
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <span className="bg-sidebar-primary text-sidebar-primary-foreground inline-flex h-7 w-7 items-center justify-center rounded-md">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">后台控制台</p>
              <p className="text-muted-foreground text-xs">Air Monitor</p>
            </div>
          </div>

          <nav className="space-y-1 p-3 text-sm">
            <button className="bg-sidebar-accent text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left">
              <BarChart3 className="h-4 w-4" />
              仪表盘
            </button>
            <button className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors">
              <FolderKanban className="h-4 w-4" />
              任务中心
            </button>
            <button className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors">
              <Bell className="h-4 w-4" />
              消息通知
            </button>
            <button className="hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors">
              <Settings className="h-4 w-4" />
              系统设置
            </button>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="bg-background/96 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:px-6">
            <div>
              <h1 className="text-base font-semibold">数据概览</h1>
              <p className="text-muted-foreground text-xs">空气监测后台</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="font-medium">{me?.username ?? '加载中...'}</p>
                <p className="text-muted-foreground">{me?.role ?? '管理员'}</p>
              </div>
              <Button onClick={logout} size="sm" variant="outline">
                <LogOut className="mr-1 h-4 w-4" />
                退出
              </Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6">
            {error ? (
              <p className="text-destructive rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">{error}</p>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricItems.map((item) => (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">{item.value}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">{item.hint}</CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>趋势占位</CardTitle>
                <CardDescription>这里可接入空气质量趋势图（后续替换真实数据）</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted relative h-52 overflow-hidden rounded-lg border">
                    <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-2 p-4">
                      {[28, 44, 36, 58, 42, 63, 52, 47].map((value, index) => (
                        <div
                          key={`${value}-${index}`}
                          className="bg-primary/80 min-w-0 flex-1 rounded-t-md"
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>当前管理员</CardTitle>
                  <CardDescription>账号状态信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="bg-muted flex items-center gap-2 rounded-md border px-3 py-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{me?.username ?? '加载中'}</span>
                  </div>
                  <div className="bg-muted flex items-center gap-2 rounded-md border px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>{me?.role ?? 'admin'}</span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>最近事件</CardTitle>
                <CardDescription>系统最新事件列表</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="py-2 pr-3 font-medium">编号</th>
                      <th className="py-2 pr-3 font-medium">事件</th>
                      <th className="py-2 pr-3 font-medium">等级</th>
                      <th className="py-2 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRows.map((row) => (
                      <tr key={row.id} className="border-b last:border-none">
                        <td className="py-3 pr-3 font-medium">{row.id}</td>
                        <td className="py-3 pr-3">{row.event}</td>
                        <td className="py-3 pr-3">{row.level}</td>
                        <td className="py-3">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
