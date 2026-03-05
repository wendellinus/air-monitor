import React from 'react';
import { Search, X } from 'lucide-react';
import type { CityItem } from '@air-monitor/shared';

import { Card } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ScreenSearchOverlayProps = {
  open: boolean;
  searchKeyword: string;
  searchResults: CityItem[];
  searchLoading: boolean;
  searchError: string | null;
  trimmedSearchKeyword: string;
  selectedCityId: string | null;
  searchInputRef: React.RefObject<HTMLInputElement>;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSelectCity: (city: CityItem) => void;
};

export function ScreenSearchOverlay(props: ScreenSearchOverlayProps): React.ReactNode {
  const {
    open,
    searchKeyword,
    searchResults,
    searchLoading,
    searchError,
    trimmedSearchKeyword,
    selectedCityId,
    searchInputRef,
    setSearchKeyword,
    onClose,
    onSelectCity,
  } = props;

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onMouseDown={onClose}
        aria-hidden="true"
      />

      <div className="absolute left-1/2 top-16 w-[min(720px,calc(100%-2rem))] -translate-x-1/2">
        <Card className="border-white/8 bg-black/10 p-4 ring-1 ring-white/10 backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-base font-semibold text-foreground">搜索城市</div>
              <div className="mt-1 text-xs text-muted-foreground">
                输入关键词搜索；回车选择第一项；ESC 关闭
              </div>
            </div>
            <button
              type="button"
              className={cn(
                'rounded-xl border border-white/8 bg-black/7 p-2 text-foreground/80 ring-1 ring-white/8 transition-colors',
                'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
              )}
              onClick={onClose}
              aria-label="关闭搜索"
            >
              <X className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <InputGroup className="h-10">
              <InputGroupInput
                ref={searchInputRef}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  const first = searchResults[0] ?? null;
                  if (!first) return;
                  onSelectCity(first);
                }}
                placeholder="搜索城市…"
                autoComplete="off"
                className="py-0"
              />
              <InputGroupAddon className="flex gap-2 px-2.5">
                {trimmedSearchKeyword ? (
                  <button
                    type="button"
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-lg border border-white/8 bg-black/7 text-foreground/75 ring-1 ring-white/8 transition-colors',
                      'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                    )}
                    onClick={() => {
                      setSearchKeyword('');
                      requestAnimationFrame(() => searchInputRef.current?.focus());
                    }}
                    aria-label="清除搜索"
                  >
                    <X className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  </button>
                ) : null}

                {searchLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
                ) : (
                  <Search className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                )}
              </InputGroupAddon>
            </InputGroup>

            <div className="rounded-2xl border border-white/10 bg-black/10 ring-1 ring-white/8">
              <ScrollArea className="h-[320px]">
                <div className="flex flex-col gap-2 p-3">
                  {!searchLoading &&
                  !searchError &&
                  trimmedSearchKeyword &&
                  searchResults.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-muted-foreground ring-1 ring-white/8">
                      暂无匹配城市，请换用其他关键词试试。
                    </div>
                  ) : null}

                  {searchResults.map((city) => (
                    <button
                      key={city.cityId}
                      type="button"
                      className={cn(
                        'group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/7 px-3 py-2 text-left ring-1 ring-white/8 transition-colors',
                        'hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
                      )}
                      onClick={() => onSelectCity(city)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{city.name}</div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {[city.adm1, city.adm2, city.country].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground/80">
                        {selectedCityId === city.cityId ? '当前' : '选择'}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
