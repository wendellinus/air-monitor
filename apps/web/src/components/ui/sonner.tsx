import * as React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      // This project is a dark, big-screen UI; keep it deterministic.
      theme="dark"
      className="toaster group"
      // Sonner sets `--width` inline by default (356px). We override via `style` because inline wins over CSS.
      style={
        {
          // Cap toast width on big screens; avoid overly wide bars that feel like banners.
          '--width': 'min(460px, calc(100vw - 32px))',
          '--border-radius': 'var(--radius)',

          // Base glass surface (lighter, more breathable than pure black).
          '--normal-bg': 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))',
          '--normal-bg-hover':
            'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.08))',
          '--normal-border': 'rgba(255,255,255,0.18)',
          '--normal-border-hover': 'rgba(255,255,255,0.24)',
          '--normal-text': 'rgba(255,255,255,0.92)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: [
            // Glassy, map-friendly toast (matches the screen cards).
            'group toast',
            // Keep all toast types visually consistent (don't scream "error" on big screens).
            'relative overflow-hidden border ring-1',
            // Accent rail (colored per type via classNames.{info|error|...}).
            "before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-white/0",
            'rounded-[var(--radius)] shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl',
          ].join(' '),
          title: 'text-[13px] font-semibold tracking-tight text-foreground/95',
          description: 'text-[12px] leading-relaxed text-muted-foreground/90',
          actionButton:
            'h-8 rounded-[calc(var(--radius)-6px)] bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90',
          cancelButton:
            'h-8 rounded-[calc(var(--radius)-6px)] bg-white/8 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/10',
          // Subtle per-type differentiation: same base glass, but a soft border tint + left rail.
          default: 'border-white/14 ring-white/10 before:bg-white/0',
          info: 'border-cyan-200/30 ring-cyan-200/12 before:bg-cyan-300/70',
          success: 'border-emerald-200/26 ring-emerald-200/12 before:bg-emerald-300/70',
          warning: 'border-amber-200/32 ring-amber-200/12 before:bg-amber-300/70',
          error: 'border-rose-200/30 ring-rose-200/12 before:bg-rose-300/70',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
