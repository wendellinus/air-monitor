import type { LoginRequest, LoginResponseData, MePermissionsData, MeResponseData } from '@air-monitor/shared';
import { GalleryVerticalEnd } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/api';
import { setTokens } from '@/shared/auth';
import { SILENT_UI_ERROR_REQUEST_CONFIG } from '@/shared/http/api-request-config';
import { useI18n } from '@/shared/i18n';
import type { Locale } from '@/shared/i18n';
import type { ApiResponse, Tokens } from '@/shared/types';
import { AdminAuthFeedback, AdminAuthShell } from '@/ui/admin/auth/components';
import { textByLocale } from '@/ui/admin/auth/lib';
import { useAdminSessionStore } from '@/ui/admin/stores/admin-session-store';

function normalizeLocale(value: string): Locale {
  return value === 'en-US' ? 'en-US' : 'zh-CN';
}

export function AdminLoginPage(): React.ReactNode {
  const navigate = useNavigate();
  const { t, locale, setLocale } = useI18n();
  const setSession = useAdminSessionStore((state) => state.setSession);
  const usernameId = React.useId();
  const passwordId = React.useId();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: LoginRequest = { username: username.trim(), password };
      const response = await api.post<ApiResponse<LoginResponseData>>(
        '/login',
        payload,
        SILENT_UI_ERROR_REQUEST_CONFIG,
      );
      const data = response.data.data;
      const tokens: Tokens = { accessToken: data.token, refreshToken: data.refreshToken };
      setTokens(tokens);
      const localeFromLogin = normalizeLocale(locale);
      const fallbackMe: MeResponseData = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        locale: localeFromLogin,
      };
      setSession({ me: fallbackMe, permissionKeys: null });

      const [meResult, permissionResult] = await Promise.allSettled([
        api.get<ApiResponse<MeResponseData>>('/user/me'),
        api.get<ApiResponse<MePermissionsData>>('/user/me/permissions'),
      ]);
      const resolvedMe =
        meResult.status === 'fulfilled' ? meResult.value.data.data : fallbackMe;
      const resolvedPermissionKeys =
        permissionResult.status === 'fulfilled' ? permissionResult.value.data.data.permissions : [];
      setSession({ me: resolvedMe, permissionKeys: resolvedPermissionKeys });
      setLocale(normalizeLocale(resolvedMe.locale));
      navigate('/admin', { replace: true });
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : t('auth.login.errorFallback'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      panelTitle={t('auth.login.title')}
      panelDescription={textByLocale(
        locale,
        '统一管理数据、权限与服务状态。',
        'Air and weather operations center for data, permissions, and service status.',
      )}
      backLabel={t('auth.backToScreen')}
    >
      <form
        className="admin-enter-delayed grid w-full max-w-[31rem] gap-7 rounded-[2rem] border border-white/80 bg-white/88 p-8 shadow-[0_30px_75px_-44px_rgba(15,23,42,0.42)] backdrop-blur-md md:p-10"
        style={{ fontFamily: "'Plus Jakarta Sans', 'PingFang SC', 'Microsoft YaHei UI', sans-serif" }}
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100/80 text-primary">
            <GalleryVerticalEnd className="size-6" />
            <span className="sr-only">{t('auth.appName')}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('auth.login.title')}</h1>
        </div>

        <div className="grid gap-2.5">
          <label className="text-sm font-medium text-slate-700" htmlFor={usernameId}>
            {t('auth.login.username')}
          </label>
          <Input
            id={usernameId}
            autoComplete="username"
            className="h-12 rounded-xl border-slate-200/90 bg-white/75 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all focus-visible:bg-white"
            placeholder={t('auth.login.usernamePlaceholder')}
            required
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="grid gap-2.5">
          <label className="text-sm font-medium text-slate-700" htmlFor={passwordId}>
            {t('auth.login.password')}
          </label>
          <Input
            id={passwordId}
            autoComplete="current-password"
            className="h-12 rounded-xl border-slate-200/90 bg-white/75 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all focus-visible:bg-white"
            placeholder={t('auth.login.passwordPlaceholder')}
            required
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="min-h-12">
          <AdminAuthFeedback tone="error" message={error} />
        </div>

        <Button
          className="h-12 w-full rounded-xl text-sm font-semibold shadow-[0_14px_30px_-18px_rgba(37,99,235,0.68)]"
          disabled={loading || !username || !password}
          type="submit"
        >
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>

        <div className="pt-1">
          <div className="mx-auto mb-3 h-px w-16 bg-slate-200" />
          <p className="text-center text-sm text-slate-500">
            {t('auth.login.subtitlePrefix')}
            <Link
              className="ml-1.5 inline-flex items-center rounded-md px-2 py-1 font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
              to="/admin/register"
            >
              {t('auth.login.registerNow')}
            </Link>
          </p>
        </div>
      </form>
    </AdminAuthShell>
  );
}

