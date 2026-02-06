import * as React from 'react';

import { cn } from '@/lib/utils';

type HoverCardContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null);

export function HoverCard(props: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  openDelayMs?: number;
  closeDelayMs?: number;
  className?: string;
}): React.ReactNode {
  const openDelayMs = props.openDelayMs ?? 120;
  const closeDelayMs = props.closeDelayMs ?? 80;

  const [open, setOpen] = React.useState<boolean>(Boolean(props.defaultOpen));
  const openTimer = React.useRef<number | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const clearTimers = React.useCallback((): void => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  React.useEffect(() => clearTimers, [clearTimers]);

  const ctx = React.useMemo<HoverCardContextValue>(
    () => ({
      open,
      setOpen: (next) => {
        clearTimers();
        if (next) {
          openTimer.current = window.setTimeout(() => setOpen(true), openDelayMs);
        } else {
          closeTimer.current = window.setTimeout(() => setOpen(false), closeDelayMs);
        }
      },
    }),
    [open, clearTimers, openDelayMs, closeDelayMs],
  );

  return (
    <HoverCardContext.Provider value={ctx}>
      <div
        className={cn('relative inline-flex', props.className)}
        onMouseEnter={() => ctx.setOpen(true)}
        onMouseLeave={() => ctx.setOpen(false)}
      >
        {props.children}
      </div>
    </HoverCardContext.Provider>
  );
}

export function HoverCardTrigger(props: { children: React.ReactElement }): React.ReactNode {
  const ctx = React.useContext(HoverCardContext);
  if (!ctx) return props.children;

  return React.cloneElement(props.children, {
    onFocus: (e: React.FocusEvent) => {
      props.children.props.onFocus?.(e);
      ctx.setOpen(true);
    },
    onBlur: (e: React.FocusEvent) => {
      props.children.props.onBlur?.(e);
      ctx.setOpen(false);
    },
  });
}

export function HoverCardContent(props: {
  children: React.ReactNode;
  className?: string;
}): React.ReactNode {
  const ctx = React.useContext(HoverCardContext);
  if (!ctx?.open) return null;
  return (
    <div
      className={cn(
        'absolute left-0 top-full z-50 mt-2 w-max max-w-[520px] overflow-hidden rounded-[var(--radius)] border border-white/10 bg-black/75 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-lg',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
