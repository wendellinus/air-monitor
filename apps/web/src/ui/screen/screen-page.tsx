import React from 'react';
import * as echarts from 'echarts';
import { Building2, MapPin } from 'lucide-react';

import type { CityItem, WeatherAlertItem } from '@air-monitor/shared';

import { type LonLat } from '@/lib/coords';
import { cn } from '@/lib/utils';

import { getAccessToken } from '@/shared/auth';
import { buildPollutantOption, buildTrendOption } from './lib/screen-charts';
import { aqiTone, toNumber } from './lib/screen-utils';
import { useScreenClock } from './hooks/use-screen-clock';
import { useScreenFavorites } from './hooks/use-screen-favorites';
import { useScreenFullscreen } from './hooks/use-screen-fullscreen';
import { useScreenLiveData } from './hooks/use-screen-live-data';
import { useScreenLocation } from './hooks/use-screen-location';
import { useScreenSearch } from './hooks/use-screen-search';
import { AMapPanel } from './widgets/amap-panel';
import { getAlertAccentColor, getAlertKind, pickPrimaryAlert } from './widgets/alert-icon';
import { ScreenBottomDock } from './widgets/screen-bottom-dock';
import { ScreenFavoritesSheet } from './widgets/screen-favorites-sheet';
import { ScreenLeftPanel } from './widgets/screen-left-panel';
import { ScreenMapAlertMarker } from './widgets/screen-map-alert-marker';
import { ScreenRightPanel } from './widgets/screen-right-panel';
import { ScreenSearchOverlay } from './widgets/screen-search-overlay';
import { ScreenStage } from './widgets/screen-stage';
import { ScreenTopBar } from './widgets/screen-top-bar';

export function ScreenPage(): React.ReactNode {
  const [selected, setSelected] = React.useState<CityItem | null>(null);
  const [favoritesOpen, setFavoritesOpen] = React.useState<boolean>(false);

  const now = useScreenClock();
  const { isFullscreen, toggleFullscreen } = useScreenFullscreen();
  const canManageFavorites = Boolean(getAccessToken());
  const { picked, setPicked, onMapClick, locateMe } = useScreenLocation({ setSelected });
  const { cities, notices, air, airHourly, alerts } = useScreenLiveData({ selected, setSelected });
  const {
    favoriteCities,
    favoriteCitySet,
    favoritesLoading,
    favoriteSubmittingCityId,
    toggleFavorite,
  } = useScreenFavorites({
    canManageFavorites,
    selectedCityId: selected?.cityId,
    favoritesOpen,
    setFavoritesOpen,
  });

  const {
    searchOpen,
    searchKeyword,
    searchResults,
    searchLoading,
    searchError,
    searchInputRef,
    setSearchKeyword,
    openSearch,
    closeSearch,
  } = useScreenSearch();

  const selectedCoord = React.useMemo((): LonLat | null => {
    if (!selected) return null;
    const lon = toNumber(selected.lon);
    const lat = toNumber(selected.lat);
    if (lon === null || lat === null) return null;
    return { lon, lat };
  }, [selected]);

  const trendOption: echarts.EChartsOption = React.useMemo(() => buildTrendOption(airHourly), [airHourly]);
  const pollutantOption: echarts.EChartsOption = React.useMemo(() => buildPollutantOption(air), [air]);

  const tone = aqiTone(air?.aqi ?? 0);

  const trimmedSearchKeyword = searchKeyword.trim();
  const marquee = notices.length > 0 ? notices.map((notice) => notice.title).join(' · ') : '暂无公告';

  const selectedAlerts: WeatherAlertItem[] = Array.isArray(alerts?.alerts) ? alerts.alerts : [];
  const primaryAlert = pickPrimaryAlert(selectedAlerts);
  const showMapAlert = Boolean(
    selected && selectedCoord && primaryAlert && selectedAlerts.length > 0,
  );
  const mapAlertKind = primaryAlert ? getAlertKind(primaryAlert) : 'default';
  const mapAlertColor = primaryAlert ? getAlertAccentColor(primaryAlert) : null;
  const mapAlertToneClassName = (() => {
    const severity = (primaryAlert?.severity ?? '').trim().toLowerCase();
    if (severity === 'extreme' || severity === 'severe') return 'text-rose-200';
    if (severity === 'moderate') return 'text-amber-200';
    if (severity === 'minor') return 'text-sky-200';
    return 'text-primary';
  })();

  const mapMarkers = React.useMemo(() => {
    const mergedCities: CityItem[] = [...cities, ...favoriteCities, ...(selected ? [selected] : [])];
    const seen = new Set<string>();
    const markers: Array<{ id: string; name: string; lon: number; lat: number }> = [];

    for (const city of mergedCities) {
      if (seen.has(city.cityId)) continue;
      const lon = toNumber(city.lon);
      const lat = toNumber(city.lat);
      if (lon === null || lat === null) continue;
      seen.add(city.cityId);
      markers.push({ id: city.cityId, name: city.name, lon, lat });
    }

    return markers;
  }, [cities, favoriteCities, selected]);

  const selectedCityId = selected?.cityId ?? null;
  const renderCityMarker = React.useCallback(
    ({ id, name }: { id: string; name: string }): React.ReactNode => {
      const isSelected = Boolean(selectedCityId && id === selectedCityId);
      return (
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'relative grid h-9 w-9 place-items-center rounded-2xl border shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 backdrop-blur-md',
              isSelected
                ? 'border-primary/28 bg-primary/14 text-primary ring-primary/20'
                : 'border-white/14 bg-black/40 text-foreground/86 ring-white/10',
            )}
            aria-label={`城市：${name}`}
          >
            <span
              className={cn(
                'pointer-events-none absolute -inset-2 rounded-[20px] blur-md',
                isSelected ? 'bg-primary/12' : 'bg-cyan-200/10',
              )}
            />
            {isSelected ? (
              <MapPin className="relative h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Building2
                className="relative h-[18px] w-[18px]"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            )}
          </div>
          <div
            className={cn(
              'relative h-2 w-2 rounded-full shadow-[0_10px_26px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
              isSelected ? 'bg-primary' : 'bg-cyan-200',
            )}
          >
            <span
              className={cn(
                'absolute -inset-2 rounded-full blur-md',
                isSelected ? 'bg-primary/12' : 'bg-cyan-200/10',
              )}
            />
          </div>
        </div>
      );
    },
    [selectedCityId],
  );

  const renderPickedMarker = React.useCallback((): React.ReactNode => {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-cyan-200/22 bg-cyan-200/10 text-cyan-100 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 ring-cyan-200/18 backdrop-blur-md">
          <span className="pointer-events-none absolute -inset-2 rounded-[22px] bg-cyan-200/10 blur-md" />
          <MapPin className="relative h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="relative h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_10px_26px_rgba(0,0,0,0.55)] ring-1 ring-white/10">
          <span className="absolute -inset-2 rounded-full bg-cyan-200/10 blur-md" />
        </div>
      </div>
    );
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <AMapPanel
          center={selectedCoord}
          markers={mapMarkers}
          renderMarker={renderCityMarker}
          onMarkerClick={(id) => {
            const found = cities.find((city) => city.cityId === id) ?? null;
            setPicked(null);
            setSelected(found);
          }}
          onMapClick={onMapClick}
          pinMarker={picked}
          renderPinMarker={renderPickedMarker}
          alertMarker={
            showMapAlert && selected && selectedCoord
              ? { id: selected.cityId, lon: selectedCoord.lon, lat: selectedCoord.lat }
              : null
          }
          renderAlertMarker={() =>
            showMapAlert && selected && primaryAlert ? (
              <ScreenMapAlertMarker
                cityName={selected.name}
                selectedAlerts={selectedAlerts}
                primaryAlert={primaryAlert}
                mapAlertKind={mapAlertKind}
                mapAlertColor={mapAlertColor}
                mapAlertToneClassName={mapAlertToneClassName}
              />
            ) : null
          }
        />

        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/40 via-black/0 to-black/62" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/32 via-transparent to-black/32" />
        <div className="pointer-events-none absolute -inset-24 opacity-50 [background:radial-gradient(closest-side,rgba(77,212,255,0.22),transparent_64%)]" />
      </div>

      <ScreenStage className="pointer-events-none">
        <div className="pointer-events-none relative flex h-full w-full flex-col gap-3 p-0">
          <ScreenTopBar marquee={marquee} now={now} searchOpen={searchOpen} onOpenSearch={openSearch} />

          <ScreenSearchOverlay
            open={searchOpen}
            searchKeyword={searchKeyword}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
            trimmedSearchKeyword={trimmedSearchKeyword}
            selectedCityId={selected?.cityId ?? null}
            searchInputRef={searchInputRef}
            setSearchKeyword={setSearchKeyword}
            onClose={closeSearch}
            onSelectCity={(city) => {
              setPicked(null);
              setSelected(city);
              closeSearch();
            }}
          />

          <main className="relative z-0 flex-1">
            <div className="absolute inset-0">
              <ScreenLeftPanel
                selected={selected}
                air={air}
                tone={tone}
                cities={cities}
                favoriteCitySet={favoriteCitySet}
                favoriteSubmittingCityId={favoriteSubmittingCityId}
                onToggleFavorite={(city) => {
                  void toggleFavorite(city);
                }}
                onSelectCity={(city) => {
                  setPicked(null);
                  setSelected(city);
                }}
              />

              <ScreenRightPanel trendOption={trendOption} pollutantOption={pollutantOption} />
            </div>
          </main>

          <div className="pointer-events-auto absolute bottom-2 left-1/2 z-40 -translate-x-1/2">
            <ScreenBottomDock
              isFullscreen={isFullscreen}
              favoriteCitiesCount={favoriteCities.length}
              onToggleFullscreen={() => {
                void toggleFullscreen();
              }}
              onOpenFavorites={() => setFavoritesOpen(true)}
              onLocateMe={locateMe}
            />

            <ScreenFavoritesSheet
              open={favoritesOpen}
              onOpenChange={setFavoritesOpen}
              canManageFavorites={canManageFavorites}
              favoritesLoading={favoritesLoading}
              favoriteCities={favoriteCities}
              favoriteSubmittingCityId={favoriteSubmittingCityId}
              selectedCityId={selected?.cityId ?? null}
              onSelectCity={(city) => {
                setSelected(city);
                setPicked(null);
                setFavoritesOpen(false);
              }}
              onToggleFavorite={(city) => {
                void toggleFavorite(city);
              }}
            />
          </div>
        </div>
      </ScreenStage>
    </div>
  );
}
