import React from 'react';
import { ArrowLeft, Compass, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/shared/i18n';

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

export function NotFoundPage(): React.ReactNode {
  const { locale } = useI18n();

  return (
    <div className="admin-theme relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[oklch(0.985_0.005_245)] px-6 py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <section className="relative z-10 flex w-full max-w-4xl items-center justify-center border-x border-slate-300/70 bg-white/75 px-6 py-12 backdrop-blur-[2px]">
        <div className="w-full max-w-xl text-center">
          <div className="h-px w-full bg-slate-300/70" />
          <div className="space-y-5 px-4 py-10">
            <p className="font-mono text-8xl font-black leading-none tracking-tight text-slate-900 md:text-9xl">404</p>
            <p className="text-base leading-7 text-slate-600">
              {textByLocale(
                locale,
                '页面可能已被移动，或者你访问的地址不存在。',
                'This page may have moved or the address does not exist.',
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild className="h-10 rounded-lg px-4">
                <Link to="/screen">
                  <Home className="size-4" />
                  {textByLocale(locale, '返回大屏', 'Back to Screen')}
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-lg px-4">
                <Link to="/admin">
                  <Compass className="size-4" />
                  {textByLocale(locale, '进入后台', 'Go to Admin')}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-10 rounded-lg px-4">
                <Link to="/admin/login">
                  <ArrowLeft className="size-4" />
                  {textByLocale(locale, '返回登录', 'Back to Login')}
                </Link>
              </Button>
            </div>
          </div>
          <div className="h-px w-full bg-slate-300/70" />
        </div>
      </section>
    </div>
  );
}
