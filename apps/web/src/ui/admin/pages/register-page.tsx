import type { RegisterRequest, RegisterResponseData } from '@air-monitor/shared';
import { GalleryVerticalEnd } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/api';
import { SILENT_UI_ERROR_REQUEST_CONFIG } from '@/shared/http/api-request-config';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';
import { AdminAuthFeedback, AdminAuthShell } from '@/ui/admin/auth/components';
import { textByLocale } from '@/ui/admin/auth/lib';

export function AdminRegisterPage(): React.ReactNode {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const usernameId = React.useId();
  const emailId = React.useId();
  const passwordId = React.useId();
  const confirmPasswordId = React.useId();

  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const redirectTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();

    if (!normalizedUsername) {
      setError(t('auth.error.usernameRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.error.passwordMin', { min: 6 }));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.error.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterRequest = {
        username: normalizedUsername,
        password,
        email: normalizedEmail || undefined,
      };
      await api.post<ApiResponse<RegisterResponseData>>(
        '/register',
        payload,
        SILENT_UI_ERROR_REQUEST_CONFIG,
      );
      setSuccess(t('auth.register.successRedirect'));
      redirectTimerRef.current = window.setTimeout(() => navigate('/admin/login', { replace: true }), 900);
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : t('auth.register.errorFallback'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      panelTitle={t('auth.register.title')}
      panelDescription={textByLocale(
        locale,
        '创建后台账号后，即可统一管理数据、权限与告警信息。',
        'Create an account to manage data, permissions, and alerts in one place.',
      )}
      backLabel={t('auth.backToScreen')}
    >
      <form
        className="admin-enter-delayed grid w-full max-w-[31rem] gap-6 rounded-[2rem] border border-white/80 bg-white/88 p-8 shadow-[0_30px_75px_-44px_rgba(15,23,42,0.42)] backdrop-blur-md md:p-10"
        style={{ fontFamily: "'Plus Jakarta Sans', 'PingFang SC', 'Microsoft YaHei UI', sans-serif" }}
        onSubmit={onSubmit}
      >
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100/80 text-primary">
            <GalleryVerticalEnd className="size-6" />
            <span className="sr-only">{t('auth.appName')}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('auth.register.title')}</h1>
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
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
          />
        </div>

        <div className="grid gap-2.5">
          <label className="text-sm font-medium text-slate-700" htmlFor={emailId}>
            {t('auth.register.emailOptional')}
          </label>
          <Input
            id={emailId}
            autoComplete="email"
            className="h-12 rounded-xl border-slate-200/90 bg-white/75 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all focus-visible:bg-white"
            placeholder="m@example.com"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
              if (success) setSuccess(null);
            }}
          />
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2.5">
            <label className="text-sm font-medium text-slate-700" htmlFor={passwordId}>
              {t('auth.login.password')}
            </label>
            <Input
              id={passwordId}
              autoComplete="new-password"
              className="h-12 rounded-xl border-slate-200/90 bg-white/75 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all focus-visible:bg-white"
              placeholder={t('auth.error.passwordMin', { min: 6 })}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError(null);
                if (success) setSuccess(null);
              }}
            />
          </div>

          <div className="grid gap-2.5">
            <label className="text-sm font-medium text-slate-700" htmlFor={confirmPasswordId}>
              {t('auth.register.confirmPassword')}
            </label>
            <Input
              id={confirmPasswordId}
              autoComplete="new-password"
              className="h-12 rounded-xl border-slate-200/90 bg-white/75 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all focus-visible:bg-white"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) setError(null);
                if (success) setSuccess(null);
              }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          <AdminAuthFeedback tone="error" message={error} />
          <AdminAuthFeedback tone="success" message={success} />
        </div>

        <Button
          className="h-12 w-full rounded-xl text-sm font-semibold shadow-[0_14px_30px_-18px_rgba(37,99,235,0.68)]"
          disabled={loading || !username || !password || !confirmPassword}
          type="submit"
        >
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>

        <div className="pt-1">
          <div className="mx-auto mb-3 h-px w-16 bg-slate-200" />
          <p className="text-center text-sm text-slate-500">
            {t('auth.register.subtitlePrefix')}
            <Link
              className="ml-1.5 inline-flex items-center rounded-md px-2 py-1 font-medium text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
              to="/admin/login"
            >
              {t('auth.register.goLogin')}
            </Link>
          </p>
        </div>
      </form>
    </AdminAuthShell>
  );
}
