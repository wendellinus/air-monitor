import React from 'react';
import { cn } from '@/lib/utils';

type PageShellProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  fitHeight?: boolean;
  className?: string;
  bodyClassName?: string;
};

export function PageShell(props: PageShellProps): React.ReactNode {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-4',
        props.fitHeight ? 'h-full min-h-0 overflow-hidden' : undefined,
        props.className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{props.title}</h2>
          {props.description ? <p className="mt-1 text-sm text-muted-foreground">{props.description}</p> : null}
        </div>
        {props.action ? <div className="shrink-0">{props.action}</div> : null}
      </div>
      <div
        className={cn(
          props.fitHeight ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : undefined,
          props.bodyClassName,
        )}
      >
        {props.children}
      </div>
    </section>
  );
}
