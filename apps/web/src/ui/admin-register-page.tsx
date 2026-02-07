import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GalleryVerticalEnd } from 'lucide-react';

import type { RegisterRequest, RegisterResponseData } from '@air-monitor/shared';

import { api } from '../shared/api';
import type { ApiResponse } from '../shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export function AdminRegisterPage(): React.ReactNode {
  const navigate = useNavigate();
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
      setError('请输入用户名');
      return;
    }

    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
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
      setSuccess('注册成功，正在跳转登录页...');
      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 900);
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : '注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-theme admin-auth-bg min-h-svh">
      <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 p-6 md:p-10">
        <div className="flex items-center justify-start text-sm">
          <Link className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5" to="/admin/login">
            <ArrowLeft className="size-4" />
            返回登录
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
                <span className="sr-only">空气监测后台</span>
              </div>
              <h1 className="text-xl font-bold">创建后台账号</h1>
              <p className="text-muted-foreground text-sm">
                已有账号？
                <Link className="text-foreground ml-1 underline underline-offset-4" to="/admin/login">
                  去登录
                </Link>
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={usernameId}>
                用户名
              </label>
              <Input
                id={usernameId}
                autoComplete="username"
                placeholder="请输入用户名"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={emailId}>
                邮箱（可选）
              </label>
              <Input
                id={emailId}
                autoComplete="email"
                placeholder="m@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={passwordId}>
                  密码
                </label>
                <Input
                  id={passwordId}
                  autoComplete="new-password"
                  placeholder="至少 6 位"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={confirmPasswordId}>
                  确认密码
                </label>
                <Input
                  id={confirmPasswordId}
                  autoComplete="new-password"
                  placeholder="再次输入"
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

            <Button className="w-full" disabled={loading || !username || !password || !confirmPassword} type="submit">
              {loading ? '创建中...' : '创建账号'}
            </Button>

            <div className="relative text-center text-sm">
              <span className="bg-card text-muted-foreground relative z-10 px-2">或</span>
              <div className="absolute inset-0 top-1/2 h-px bg-border" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Button className="w-full" type="button" variant="outline">
                <AppleIcon />
                使用 Apple
              </Button>
              <Button className="w-full" type="button" variant="outline">
                <GoogleIcon />
                使用 Google
              </Button>
            </div>
          </form>

          <p className="text-muted-foreground px-6 text-center text-xs leading-relaxed">
            点击继续即表示你同意我们的
            <button className="hover:text-primary px-1 underline underline-offset-4" type="button">
              服务条款
            </button>
            与
            <button className="hover:text-primary px-1 underline underline-offset-4" type="button">
              隐私政策
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

