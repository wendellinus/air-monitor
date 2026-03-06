import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    // Keep logs for production issue tracing; UI stays friendly for users.
    // eslint-disable-next-line no-console
    console.error('AppErrorBoundary caught an error:', error);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="admin-theme flex min-h-svh items-center justify-center bg-[oklch(0.985_0.005_245)] p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
          <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertTriangle className="size-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{'\u9875\u9762\u53d1\u751f\u5f02\u5e38'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {
              '\u7cfb\u7edf\u9047\u5230\u4e86\u4e00\u4e2a\u610f\u5916\u9519\u8bef\uff0c\u53ef\u4ee5\u5148\u5237\u65b0\u9875\u9762\u91cd\u8bd5\u3002'
            }
          </p>
          <div className="mt-5">
            <Button type="button" onClick={this.handleReload} className="w-full gap-2">
              <RefreshCw className="size-4" />
              {'\u5237\u65b0\u9875\u9762'}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

