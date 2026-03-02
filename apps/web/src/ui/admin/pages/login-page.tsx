import type { LoginRequest, LoginResponseData } from '@air-monitor/shared';
import { GalleryVerticalEnd } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/api';
import { setTokens } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse, Tokens } from '@/shared/types';

export function AdminLoginPage(): React.ReactNode {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      const response = await api.post<ApiResponse<LoginResponseData>>('/login', payload);
      const data = response.data.data;
      const tokens: Tokens = { accessToken: data.token, refreshToken: data.refreshToken };
      setTokens(tokens);
      navigate('/admin', { replace: true });
    } catch (errorValue) {
      setError(
        errorValue instanceof Error ? errorValue.message : t('auth.login.errorFallback'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-theme admin-auth-bg min-h-svh">
      <div className="mx-auto flex min-h-svh w-full max-w-[30rem] items-center p-6 md:p-10">
        <form
          className="admin-enter-delayed grid w-full gap-6 rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_28px_75px_-42px_rgba(15,23,42,0.5)] backdrop-blur-sm md:p-9"
          onSubmit={onSubmit}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GalleryVerticalEnd className="size-6" />
              <span className="sr-only">{t('auth.appName')}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('auth.login.subtitlePrefix')}
              <Link className="text-foreground ml-1 underline underline-offset-4" to="/admin/register">
                {t('auth.login.registerNow')}
              </Link>
            </p>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium" htmlFor={usernameId}>
              {t('auth.login.username')}
            </label>
            <Input
              id={usernameId}
              autoComplete="username"
              className="h-12 border-slate-200 bg-slate-100/70 px-4"
              placeholder={t('auth.login.usernamePlaceholder')}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium" htmlFor={passwordId}>
              {t('auth.login.password')}
            </label>
            <Input
              id={passwordId}
              autoComplete="current-password"
              className="h-12 border-slate-200 bg-slate-100/70 px-4"
              placeholder={t('auth.login.passwordPlaceholder')}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? (
            <p aria-live="polite" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}

          <Button
            className="h-12 w-full rounded-xl text-sm font-semibold shadow-[0_10px_28px_-16px_rgba(37,99,235,0.8)]"
            disabled={loading || !username || !password}
            type="submit"
          >
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
