import type { LoginRequest, LoginResponseData } from '@air-monitor/shared';
import { ArrowLeft, GalleryVerticalEnd } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/api';
import { setTokens } from '@/shared/auth';
import { useI18n } from '@/shared/i18n';
import type { ApiResponse, Tokens } from '@/shared/types';

function AppleIcon(): React.ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
        fill="currentColor"
      />
    </svg>
  );
}

function GoogleIcon(): React.ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  );
}

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
      <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 p-6 md:p-10">
        <div className="flex items-center justify-start text-sm">
          <Link
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            to="/screen"
          >
            <ArrowLeft className="size-4" />
            {t('auth.backToScreen')}
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <form
            className="grid gap-6 rounded-xl border border-border/70 bg-card/92 p-6 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur"
            onSubmit={onSubmit}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <span className="sr-only">{t('auth.appName')}</span>
              </div>
              <h1 className="text-xl font-bold">{t('auth.login.title')}</h1>
              <p className="text-muted-foreground text-sm">
                {t('auth.login.subtitlePrefix')}
                <Link
                  className="text-foreground ml-1 underline underline-offset-4"
                  to="/admin/register"
                >
                  {t('auth.login.registerNow')}
                </Link>
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={usernameId}>
                {t('auth.login.username')}
              </label>
              <Input
                id={usernameId}
                autoComplete="username"
                placeholder={t('auth.login.usernamePlaceholder')}
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={passwordId}>
                {t('auth.login.password')}
              </label>
              <Input
                id={passwordId}
                autoComplete="current-password"
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

            <Button className="w-full" disabled={loading || !username || !password} type="submit">
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>

            <div className="relative text-center text-sm">
              <span className="bg-card text-muted-foreground relative z-10 px-2">{t('auth.or')}</span>
              <div className="absolute inset-0 top-1/2 h-px bg-border" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button className="w-full" type="button" variant="outline">
                <AppleIcon />
                {t('auth.continueWithApple')}
              </Button>
              <Button className="w-full" type="button" variant="outline">
                <GoogleIcon />
                {t('auth.continueWithGoogle')}
              </Button>
            </div>
          </form>

          <p className="text-muted-foreground px-6 text-center text-xs leading-relaxed">
            {t('auth.termsPrefix')}
            <button className="hover:text-primary px-1 underline underline-offset-4" type="button">
              {t('auth.terms')}
            </button>
            {t('auth.and')}
            <button className="hover:text-primary px-1 underline underline-offset-4" type="button">
              {t('auth.privacy')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
