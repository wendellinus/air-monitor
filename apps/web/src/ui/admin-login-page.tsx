import React from 'react';
import { useNavigate } from 'react-router-dom';

import type { LoginRequest, LoginResponseData } from '@go-practice/shared';

import { api } from '../shared/api';
import { setTokens } from '../shared/auth';
import type { ApiResponse, Tokens } from '../shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminLoginPage(): React.ReactNode {
  const nav = useNavigate();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: LoginRequest = { username, password };
      const res = await api.post<ApiResponse<LoginResponseData>>('/login', payload);
      const data = res.data.data;
      const tokens: Tokens = { accessToken: data.token, refreshToken: data.refreshToken };
      setTokens(tokens);
      nav('/admin', { replace: true });
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : '登录失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">Air Quality Monitor · Admin</div>
        <div className="hint">API: /api/v1</div>
      </div>
      <div className="container">
        <Card style={{ maxWidth: 520, margin: '0 auto' }}>
          <CardHeader>
            <CardTitle>登录</CardTitle>
            <CardDescription>使用后端的 `/api/v1/login` 获取 token</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit}>
              <div className="row" style={{ marginBottom: 10 }}>
                <input
                  className="input"
                  placeholder="用户名"
                  value={username}
                  onChange={(ev) => setUsername(ev.target.value)}
                />
              </div>
              <div className="row" style={{ marginBottom: 10 }}>
                <input
                  className="input"
                  placeholder="密码"
                  type="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                />
              </div>
              {error ? <div className="error" style={{ marginBottom: 10 }}>{error}</div> : null}
              <div className="row">
                <Button disabled={loading || !username || !password} type="submit">
                  {loading ? '登录中…' : '登录'}
                </Button>
                <div className="hint">需要已存在账号（可用 `pnpm prisma:seed` 创建初始账号）。</div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
