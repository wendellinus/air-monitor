import type { RegisterRequest, RegisterResponseData } from '@air-monitor/shared';
import { GalleryVerticalEnd } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/api';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse } from '@/shared/types';

export function AdminRegisterPage(): React.ReactNode {
  const navigate = useNavigate();
  const { t } = useI18n();
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
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
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
      await api.post<ApiResponse<RegisterResponseData>>('/register', payload);
      setSuccess(t('auth.register.successRedirect'));
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 900);
    } catch (errorValue) {
      setError(
        errorValue instanceof Error ? errorValue.message : t('auth.register.errorFallback'),
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
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.register.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('auth.register.subtitlePrefix')}
              <Link className="text-foreground ml-1 underline underline-offset-4" to="/admin/login">
                {t('auth.register.goLogin')}
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
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium" htmlFor={emailId}>
              {t('auth.register.emailOptional')}
            </label>
            <Input
              id={emailId}
              autoComplete="email"
              className="h-12 border-slate-200 bg-slate-100/70 px-4"
              placeholder="m@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3">
              <label className="text-sm font-medium" htmlFor={passwordId}>
                {t('auth.login.password')}
              </label>
              <Input
                id={passwordId}
                autoComplete="new-password"
                className="h-12 border-slate-200 bg-slate-100/70 px-4"
                placeholder={t('auth.error.passwordMin', { min: 6 })}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium" htmlFor={confirmPasswordId}>
                {t('auth.register.confirmPassword')}
              </label>
              <Input
                id={confirmPasswordId}
                autoComplete="new-password"
                className="h-12 border-slate-200 bg-slate-100/70 px-4"
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-5">
            {error ? (
              <p aria-live="polite" className="text-destructive text-sm">
                {error}
              </p>
            ) : null}
            {success ? (
              <p aria-live="polite" className="text-sm text-emerald-600">
                {success}
              </p>
            ) : null}
          </div>

          <Button
            className="h-12 w-full rounded-xl text-sm font-semibold shadow-[0_10px_28px_-16px_rgba(37,99,235,0.8)]"
            disabled={loading || !username || !password || !confirmPassword}
            type="submit"
          >
            {loading ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
