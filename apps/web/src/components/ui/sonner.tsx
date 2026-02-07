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
            '[--toast-accent:transparent] [--normal-border:rgba(255,255,255,0.18)] [--toast-ring:rgba(255,255,255,0.10)]',
            'data-[type=info]:[--toast-accent:rgba(103,232,249,0.72)] data-[type=info]:[--normal-border:rgba(165,243,252,0.30)] data-[type=info]:[--toast-ring:rgba(165,243,252,0.18)]',
            'data-[type=success]:[--toast-accent:rgba(110,231,183,0.72)] data-[type=success]:[--normal-border:rgba(167,243,208,0.28)] data-[type=success]:[--toast-ring:rgba(167,243,208,0.18)]',
            'data-[type=warning]:[--toast-accent:rgba(252,211,77,0.76)] data-[type=warning]:[--normal-border:rgba(253,230,138,0.32)] data-[type=warning]:[--toast-ring:rgba(253,230,138,0.18)]',
            'data-[type=error]:[--toast-accent:rgba(251,113,133,0.76)] data-[type=error]:[--normal-border:rgba(254,205,211,0.30)] data-[type=error]:[--toast-ring:rgba(254,205,211,0.18)]',
            // Accent rail picks color from --toast-accent.
            "before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[var(--toast-accent)]",
            'ring-[color:var(--toast-ring)]',
            'rounded-[var(--radius)] shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl',
          ].join(' '),
          title: 'text-[13px] font-semibold tracking-tight text-foreground/95',
          description: 'text-[12px] leading-relaxed text-muted-foreground/90',
          actionButton:
            'h-8 rounded-[calc(var(--radius)-6px)] bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90',
          cancelButton:
            'h-8 rounded-[calc(var(--radius)-6px)] bg-white/8 px-3 text-xs font-semibold text-muted-foreground hover:bg-white/10',
          // Keep type class slots empty: Sonner applies `default` to all toasts in v2.
          // Type differences are handled in `toast` via data-[type=*] variants above.
          default: '',
          info: '',
          success: '',
          warning: '',
          error: '',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
