import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FloatingPaths } from '@/components/floating-paths';
import { Logo } from '@/components/logo';

type AdminAuthShellProps = {
  panelTitle: string;
  panelDescription: string;
  backLabel: string;
  children: React.ReactNode;
};

export function AdminAuthShell(props: AdminAuthShellProps): React.ReactNode {
  return (
    <div className="admin-theme admin-auth-bg min-h-svh">
      <main className="relative min-h-svh lg:grid lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-slate-200/80 bg-slate-100/65 p-10 lg:flex lg:flex-col">
          <Logo className="h-5 text-slate-800" />
          <div className="z-10 mt-auto space-y-3 rounded-2xl border border-white/70 bg-white/75 p-6 backdrop-blur-sm">
            <p className="text-xl font-semibold text-slate-800">{props.panelTitle}</p>
            <p className="text-sm text-slate-500">{props.panelDescription}</p>
          </div>
          <div className="pointer-events-none absolute inset-0">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>
        </section>

        <section className="relative flex min-h-svh items-center justify-center px-6 py-10 md:px-10">
          <Link
            className="absolute left-6 top-7 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 transition-colors hover:text-slate-700 md:left-10"
            to="/screen"
          >
            <ArrowLeft className="size-3.5" />
            {props.backLabel}
          </Link>
          {props.children}
        </section>
      </main>
    </div>
  );
}
