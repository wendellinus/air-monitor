import React from 'react';
import { Heart, LocateFixed, Maximize2, Minimize2 } from 'lucide-react';

import { Dock, DockIcon } from '@/components/ui/dock';
import { cn } from '@/lib/utils';

type ScreenBottomDockProps = {
  isFullscreen: boolean;
  favoriteCitiesCount: number;
  onToggleFullscreen: () => void;
  onOpenFavorites: () => void;
  onLocateMe: () => void;
};

export function ScreenBottomDock(props: ScreenBottomDockProps): React.ReactNode {
  return (
    <Dock
      className={cn(
        'mt-0 rounded-[var(--radius)] border-white/16 bg-black/30 shadow-[0_18px_60px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
        'supports-backdrop-blur:bg-black/22 backdrop-saturate-150',
      )}
      iconSize={44}
      iconMagnification={70}
      iconDistance={160}
      direction="middle"
    >
      <DockIcon
        role="button"
        tabIndex={0}
        aria-label="全屏"
        title="全屏"
        className={cn(
          'text-foreground/90 transition-colors',
          'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
          props.isFullscreen && 'bg-white/8',
        )}
        onClick={props.onToggleFullscreen}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          props.onToggleFullscreen();
        }}
      >
        {props.isFullscreen ? (
          <Minimize2 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <Maximize2 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        )}
      </DockIcon>

      <DockIcon
        role="button"
        tabIndex={0}
        aria-label="收藏城市列表"
        title="收藏城市列表"
        className={cn(
          'text-foreground/90 transition-colors',
          'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
          props.favoriteCitiesCount > 0 && 'bg-white/8',
        )}
        onClick={props.onOpenFavorites}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          props.onOpenFavorites();
        }}
      >
        <div className="relative">
          <Heart className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          {props.favoriteCitiesCount > 0 ? (
            <span className="absolute -right-2.5 -top-2.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {Math.min(props.favoriteCitiesCount, 99)}
            </span>
          ) : null}
        </div>
      </DockIcon>

      <DockIcon
        role="button"
        tabIndex={0}
        aria-label="定位到当前位置"
        title="定位到当前位置"
        className={cn(
          'text-foreground/90 transition-colors',
          'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
        )}
        onClick={props.onLocateMe}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          props.onLocateMe();
        }}
      >
        <LocateFixed className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
      </DockIcon>
    </Dock>
  );
}
