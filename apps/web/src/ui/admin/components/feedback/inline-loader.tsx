import React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type InlineLoaderProps = {
  label?: string;
  className?: string;
};

export function InlineLoader(props: InlineLoaderProps): React.ReactNode {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-muted-foreground', props.className)}>
      <Spinner className="h-3.5 w-3.5" />
      <span>{props.label ?? '刷新中...'}</span>
    </span>
  );
}
