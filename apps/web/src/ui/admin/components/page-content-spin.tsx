import React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type PageContentSpinProps = {
  spinning: boolean;
  tip?: string;
  children: React.ReactNode;
  className?: string;
};

export function PageContentSpin(props: PageContentSpinProps): React.ReactNode {
  return (
    <div className={cn('relative flex min-h-0 flex-col', props.className)}>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          props.spinning ? 'pointer-events-none select-none' : undefined,
        )}
      >
        {props.children}
      </div>
      {props.spinning ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 rounded-md border border-border/70 bg-background/90 px-4 py-3 shadow-sm">
            <Spinner className="h-5 w-5 text-primary" />
            {props.tip ? <p className="text-xs text-muted-foreground">{props.tip}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
