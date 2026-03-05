import React from 'react';
import type { CityItem } from '@air-monitor/shared';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ScreenFavoritesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageFavorites: boolean;
  favoritesLoading: boolean;
  favoriteCities: CityItem[];
  favoriteSubmittingCityId: string | null;
  selectedCityId: string | null;
  onSelectCity: (city: CityItem) => void;
  onToggleFavorite: (city: CityItem) => void;
};

export function ScreenFavoritesSheet(props: ScreenFavoritesSheetProps): React.ReactNode {
  const {
    open,
    onOpenChange,
    canManageFavorites,
    favoritesLoading,
    favoriteCities,
    favoriteSubmittingCityId,
    selectedCityId,
    onSelectCity,
    onToggleFavorite,
  } = props;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[65vh] w-[min(620px,calc(100vw-16px))] rounded-t-2xl border-white/14 bg-black/70 p-0 text-foreground backdrop-blur-xl"
      >
        <div className="p-4">
          <SheetHeader>
            <SheetTitle className="text-left text-base">收藏城市</SheetTitle>
            <SheetDescription className="text-left">
              {canManageFavorites
                ? '点击城市可快速切换，收藏会绑定到当前登录用户。'
                : '当前未登录，登录后才能使用用户收藏同步。'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-4 pb-4">
          {!canManageFavorites ? (
            <div className="rounded-xl border border-dashed border-white/14 bg-black/35 px-3 py-3 text-sm text-muted-foreground">
              请先前往
              <a className="px-1 text-primary underline underline-offset-4" href="/admin/login">
                后台登录
              </a>
              ，再使用收藏城市功能。
            </div>
          ) : favoritesLoading ? (
            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-muted-foreground">
              正在加载收藏城市...
            </div>
          ) : favoriteCities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/14 bg-black/35 px-3 py-3 text-sm text-muted-foreground">
              暂无收藏城市，先在左侧城市信息卡片里点“收藏”。
            </div>
          ) : (
            <ScrollArea className="h-[min(44vh,360px)]">
              <div className="space-y-2 pr-2">
                {favoriteCities.map((city) => (
                  <button
                    key={city.cityId}
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-left transition-colors',
                      'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                      selectedCityId === city.cityId && 'border-primary/30 bg-primary/12',
                    )}
                    onClick={() => onSelectCity(city)}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{city.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[city.adm1, city.adm2, city.country].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="ml-3 h-8 shrink-0 text-xs"
                      disabled={favoriteSubmittingCityId === city.cityId}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(city);
                      }}
                    >
                      取消收藏
                    </Button>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
