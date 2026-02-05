import * as React from 'react';

import { cn } from '@/lib/utils';

export function InputGroup(props: React.HTMLAttributes<HTMLDivElement>): React.ReactNode {
  return (
    <div
      {...props}
      className={cn(
        'flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-black/16 shadow-sm ring-1 ring-white/8 backdrop-blur-sm',
        'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20',
        props.className,
      )}
    />
  );
}

export type InputGroupInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          'min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground',
          className,
        )}
      />
    );
  },
);
InputGroupInput.displayName = 'InputGroupInput';

export type InputGroupAddonProps = React.HTMLAttributes<HTMLDivElement>;

export function InputGroupAddon(props: InputGroupAddonProps): React.ReactNode {
  return (
    <div
      {...props}
      className={cn(
        'grid shrink-0 place-items-center border-l border-white/10 bg-black/12 px-2.5 text-foreground/80',
        props.className,
      )}
    />
  );
}

