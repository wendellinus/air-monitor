import React from 'react';
import { Heart } from 'lucide-react';
import type { AirNowItem, CityItem } from '@air-monitor/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { formatDateTime } from '../lib/screen-utils';
import { ScreenGlassCard } from './screen-glass-card';

type AqiTone = { label: string; className: string };

type ScreenLeftPanelProps = {
  selected: CityItem | null;
  air: AirNowItem | null;
  tone: AqiTone;
  cities: CityItem[];
  favoriteCitySet: Set<string>;
  favoriteSubmittingCityId: string | null;
  onToggleFavorite: (city: CityItem) => void;
  onSelectCity: (city: CityItem) => void;
};

export function ScreenLeftPanel(props: ScreenLeftPanelProps): React.ReactNode {
  const {
    selected,
    air,
    tone,
    cities,
    favoriteCitySet,
    favoriteSubmittingCityId,
    onToggleFavorite,
    onSelectCity,
  } = props;

  return (
    <div className="pointer-events-auto absolute left-2 top-0 bottom-0 w-[300px] min-h-0">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <ScreenGlassCard className="rounded-[8px] p-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{selected?.name ?? '未选择城市'}</CardTitle>
            <CardDescription className="text-sm">
              {selected
                ? `${selected.adm1}${selected.adm2 ? ` · ${selected.adm2}` : ''}`
                : '点击热门城市或地图定位选择城市'}
            </CardDescription>
            {selected ? (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-xl border border-white/8 bg-black/8 px-2.5 text-foreground/85 ring-1 ring-white/8 hover:bg-white/7"
                  onClick={() => onToggleFavorite(selected)}
                  disabled={favoriteSubmittingCityId === selected.cityId}
                  aria-label={favoriteCitySet.has(selected.cityId) ? '取消收藏' : '收藏城市'}
                  title={favoriteCitySet.has(selected.cityId) ? '取消收藏' : '收藏城市'}
                >
                  <Heart
                    className={cn(
                      'mr-1.5 h-4 w-4',
                      favoriteCitySet.has(selected.cityId)
                        ? 'fill-rose-400 text-rose-300'
                        : 'text-foreground/75',
                    )}
                    strokeWidth={2.1}
                  />
                  {favoriteSubmittingCityId === selected.cityId
                    ? '处理中...'
                    : favoriteCitySet.has(selected.cityId)
                      ? '已收藏'
                      : '收藏'}
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-end justify-between">
              <div className={cn('text-5xl font-semibold tracking-tight drop-shadow', tone.className)}>
                {air?.aqi ?? '-'}
              </div>
              <div className="text-right">
                <div className={cn('text-base font-semibold', tone.className)}>{tone.label}</div>
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div>发布时间：{formatDateTime(air?.pubTime)}</div>
              <div>首要污染物：{air?.primary ?? '-'}</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <Card className="rounded-xl border-white/8 bg-black/8 ring-1 ring-white/8 backdrop-blur-xl">
                <CardContent className="p-2.5">
                  <div className="text-muted-foreground">PM2.5</div>
                  <div className="mt-1 text-sm font-medium">{air?.pm2p5 ?? '-'}</div>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-white/8 bg-black/8 ring-1 ring-white/8 backdrop-blur-xl">
                <CardContent className="p-2.5">
                  <div className="text-muted-foreground">PM10</div>
                  <div className="mt-1 text-sm font-medium">{air?.pm10 ?? '-'}</div>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-white/8 bg-black/8 ring-1 ring-white/8 backdrop-blur-xl">
                <CardContent className="p-2.5">
                  <div className="text-muted-foreground">O3</div>
                  <div className="mt-1 text-sm font-medium">{air?.o3 ?? '-'}</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </ScreenGlassCard>

        <ScreenGlassCard className="flex min-h-0 flex-1 flex-col rounded-[8px]">
          <CardHeader className="p-5 pb-4">
            <CardTitle className="text-base">热门城市</CardTitle>
            <CardDescription className="text-sm">点击列表或地图点位切换城市</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <div
              className="h-full"
              onWheelCapture={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 p-5 pt-2 pb-6">
                  {cities.map((city) => (
                    <Button
                      key={city.cityId}
                      size="sm"
                      variant="ghost"
                      className={cn(
                        'w-full justify-center rounded-2xl border px-2.5 py-1.5 text-center text-[13px] font-medium transition-colors',
                        'border-white/8 bg-black/7 text-foreground/90 ring-1 ring-white/8',
                        'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                        selected?.cityId === city.cityId &&
                          'border-primary/25 bg-primary/12 text-foreground ring-primary/20',
                      )}
                      onClick={() => onSelectCity(city)}
                    >
                      {favoriteCitySet.has(city.cityId) ? (
                        <Heart className="mr-1.5 h-3.5 w-3.5 fill-rose-400 text-rose-300" />
                      ) : null}
                      {city.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </ScreenGlassCard>
      </div>
    </div>
  );
}
