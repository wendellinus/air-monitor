import React from 'react';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

type TaskProgressStatus = 'running' | 'success' | 'error';

type TaskProgressBannerProps = {
  percent: number;
  title?: string;
  description?: string;
  status?: TaskProgressStatus;
  className?: string;
  onClose?: () => void;
};

function statusMeta(status: TaskProgressStatus): {
  icon: React.ReactNode;
  tone: string;
} {
  if (status === 'success') {
    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: 'text-emerald-600',
    };
  }
  if (status === 'error') {
    return {
      icon: <XCircle className="h-4 w-4" />,
      tone: 'text-red-600',
    };
  }
  return {
    icon: <Clock3 className="h-4 w-4" />,
    tone: 'text-blue-600',
  };
}

export function TaskProgressBanner(props: TaskProgressBannerProps): React.ReactNode {
  const status = props.status ?? 'running';
  const normalizedPercent = Math.max(0, Math.min(100, Number.isFinite(props.percent) ? props.percent : 0));
  const meta = statusMeta(status);

  return (
    <div className={cn('rounded-lg border border-border/80 bg-card p-3 shadow-sm', props.className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn(meta.tone)}>{meta.icon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {props.title ?? '任务进行中'}
            </p>
            {props.description ? (
              <p className="truncate text-xs text-muted-foreground">{props.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{Math.round(normalizedPercent)}%</span>
          {props.onClose ? (
            <button
              type="button"
              onClick={props.onClose}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              关闭
            </button>
          ) : null}
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted/60">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            status === 'success'
              ? 'bg-emerald-500'
              : status === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500',
          )}
          style={{ width: `${normalizedPercent}%` }}
        />
      </div>
    </div>
  );
}
