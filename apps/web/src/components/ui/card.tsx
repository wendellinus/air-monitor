import * as React from 'react';

import { cn } from '@/lib/utils';

export function Card(props: React.HTMLAttributes<HTMLDivElement>): React.ReactNode {
  return <div className={cn('rounded-[--radius] border border-border bg-card text-card-foreground', props.className)} {...props} />;
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>): React.ReactNode {
  return <div className={cn('flex flex-col gap-1.5 p-6', props.className)} {...props} />;
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>): React.ReactNode {
  return <h3 className={cn('text-base font-semibold leading-none tracking-tight', props.className)} {...props} />;
}

export function CardDescription(props: React.HTMLAttributes<HTMLParagraphElement>): React.ReactNode {
  return <p className={cn('text-sm text-muted-foreground', props.className)} {...props} />;
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>): React.ReactNode {
  return <div className={cn('p-6 pt-0', props.className)} {...props} />;
}

export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>): React.ReactNode {
  return <div className={cn('flex items-center p-6 pt-0', props.className)} {...props} />;
}

