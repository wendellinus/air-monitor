import React from 'react';
import { useNavigate } from 'react-router-dom';

import type { MeResponseData } from '@go-practice/shared';

import { api } from '../shared/api';
import { clearTokens } from '../shared/auth';
import type { ApiResponse } from '../shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminLayout(): React.ReactNode {
  const nav = useNavigate();
  const [me, setMe] = React.useState<MeResponseData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<ApiResponse<MeResponseData>>('/user/me');
        if (mounted) setMe(res.data.data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : '加载失败');
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
      // ignore
    } finally {
      clearTokens();
      nav('/admin/login', { replace: true });
    }
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">Air Quality Monitor · Admin</div>
        <div className="row">
          <div className="hint">{me ? `当前：${me.username} (${me.role})` : '加载中…'}</div>
          <Button variant="secondary" onClick={logout}>
            退出
          </Button>
        </div>
      </div>
      <div className="container">
        <Card>
          <CardHeader>
            <CardTitle>后台骨架</CardTitle>
            <CardDescription>下一步：用户管理 / 公告管理 / 大屏城市配置</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? <div className="error">{error}</div> : null}
            <div className="hint">
              目前已打通：登录（/login）→ token 持久化 → 受保护接口（/user/me）→ 退出（/logout）。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
