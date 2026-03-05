import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type InitialSkeletonProps = {
  variant?: 'table' | 'cards' | 'mixed';
  rows?: number;
  className?: string;
};

export function InitialSkeleton(props: InitialSkeletonProps): React.ReactNode {
  const variant = props.variant ?? 'table';
  const rows = props.rows ?? 6;

  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', props.className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={`card-skeleton-${index}`} className="rounded-lg border border-border/80 bg-card p-4 shadow-sm">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-4 w-24" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'mixed') {
    return (
      <div className={cn('space-y-4', props.className)}>
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-sm">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={`mixed-skeleton-${index}`} className="rounded-lg border border-border/80 bg-card p-4 shadow-sm">
              <Skeleton className="h-5 w-32" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm', props.className)}>
      <div className="bg-muted/30 px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-2 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={`table-skeleton-${index}`} className="grid grid-cols-6 gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
