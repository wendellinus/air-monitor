import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type AdminAuthFeedbackProps = {
  tone: 'error' | 'success';
  message: string | null;
};

export function AdminAuthFeedback(props: AdminAuthFeedbackProps): React.ReactNode {
  if (!props.message) return null;

  const isError = props.tone === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'flex min-h-12 items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        isError
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="leading-6">{props.message}</p>
    </div>
  );
}
