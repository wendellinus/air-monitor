import React from 'react';
import { Building2, MapPin } from 'lucide-react';

import type { CityItem, WeatherAlertItem } from '@air-monitor/shared';

import { type LonLat } from '@/lib/coords';
import { cn } from '@/lib/utils';

import { getAccessToken } from '@/shared/auth';
import { useSystemPollingInterval } from '@/shared/hooks/use-system-polling-interval';
import {
  buildAqiAreaOption,
  buildAqiBoxplotOption,
  buildAqiComboOption,
  buildAqiGaugeOption,
  buildAqiLineOption,
  buildAqiRingOption,
  buildHourlyHeatmapOption,
  buildPollutantBarOption,
  buildPollutantPieOption,
  buildPollutantRadarOption,
  buildPollutantScatterOption,
  buildPollutantStackedOption,
  buildRiskMatrixOption,
  buildSpatialTrendOption,
} from './lib/screen-charts';
import { aqiTone, toNumber } from './lib/screen-utils';
import { useScreenClock } from './hooks/use-screen-clock';
import { useScreenCitySnapshots } from './hooks/use-screen-city-snapshots';
import { useScreenFavorites } from './hooks/use-screen-favorites';
import { useScreenFullscreen } from './hooks/use-screen-fullscreen';
import { useScreenHistoryPlayback } from './hooks/use-screen-history-playback';
import { useScreenLiveData } from './hooks/use-screen-live-data';
import { useScreenLocation } from './hooks/use-screen-location';
import { useScreenSearch } from './hooks/use-screen-search';
import { AMapPanel } from './widgets/amap-panel';
import { getAlertAccentColor, getAlertKind, pickPrimaryAlert } from './widgets/alert-icon';
import { ScreenBottomDock } from './widgets/screen-bottom-dock';
import { ScreenFavoritesSheet } from './widgets/screen-favorites-sheet';
import { ScreenLeftPanel } from './widgets/screen-left-panel';
import { ScreenMapAlertMarker } from './widgets/screen-map-alert-marker';
import {
  ScreenRightPanel,
  type ScreenChartOptions,
  type ScreenCompareSummary,
  type ScreenRankingItem,
} from './widgets/screen-right-panel';
import { ScreenSearchOverlay } from './widgets/screen-search-overlay';
import { ScreenStage } from './widgets/screen-stage';
import { ScreenTopBar } from './widgets/screen-top-bar';

type MarkerTone = {
  shellClassName: string;
  glowClassName: string;
  dotClassName: string;
  iconClassName: string;
  showPing: boolean;
  statusLabel: string;
};

function pickMarkerTone(aqi: number | null, alertCount: number): MarkerTone {
  if (alertCount > 0) {
    return {
      shellClassName: 'border-rose-300/35 bg-rose-500/18 text-rose-100 ring-rose-300/20',
      glowClassName: 'bg-rose-400/25',
      dotClassName: 'bg-rose-300',
      iconClassName: 'text-rose-100',
      showPing: true,
      statusLabel: '天气预警',
    };
  }

  if ((aqi ?? 0) >= 180) {
    return {
      shellClassName: 'border-orange-300/35 bg-orange-500/18 text-orange-100 ring-orange-300/20',
      glowClassName: 'bg-orange-400/25',
      dotClassName: 'bg-orange-300',
      iconClassName: 'text-orange-100',
      showPing: true,
      statusLabel: 'AQI 偏高',
    };
  }

  if ((aqi ?? 0) >= 120) {
    return {
      shellClassName: 'border-amber-300/35 bg-amber-400/18 text-amber-100 ring-amber-300/18',
      glowClassName: 'bg-amber-300/22',
      dotClassName: 'bg-amber-200',
      iconClassName: 'text-amber-100',
      showPing: false,
      statusLabel: 'AQI 关注',
    };
  }

  return {
    shellClassName: 'border-cyan-200/18 bg-black/40 text-foreground/86 ring-white/10',
    glowClassName: 'bg-cyan-200/10',
    dotClassName: 'bg-cyan-200',
    iconClassName: 'text-foreground/86',
    showPing: false,
    statusLabel: '常规城市',
  };
}

export function ScreenPage(): React.ReactNode {
  const [selected, setSelected] = React.useState<CityItem | null>(null);
  const [favoritesOpen, setFavoritesOpen] = React.useState<boolean>(false);

  const now = useScreenClock();
  const { pollingIntervalMs } = useSystemPollingInterval();
  const { isFullscreen, toggleFullscreen } = useScreenFullscreen();
  const canManageFavorites = Boolean(getAccessToken());
  const { picked, setPicked, onMapClick, locateMe } = useScreenLocation({ setSelected });
  const { cities, notices, air, airHourly, alerts } = useScreenLiveData({ selected, setSelected });
  const citySnapshots = useScreenCitySnapshots({ cities, pollingIntervalMs });
  const historyPlayback = useScreenHistoryPlayback(airHourly, air);
  const displayAir = historyPlayback.currentAir;

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

  const chartOptions: ScreenChartOptions = React.useMemo(
    () => ({
      aqiLine: buildAqiLineOption(airHourly),
      aqiArea: buildAqiAreaOption(airHourly),
      aqiCombo: buildAqiComboOption(airHourly),
      aqiGauge: buildAqiGaugeOption(displayAir),
      aqiRing: buildAqiRingOption(displayAir),
      pollutantBar: buildPollutantBarOption(displayAir),
      pollutantStacked: buildPollutantStackedOption(airHourly),
      pollutantPie: buildPollutantPieOption(displayAir),
      pollutantRadar: buildPollutantRadarOption(displayAir),
      aqiBoxplot: buildAqiBoxplotOption(airHourly),
      hourlyHeatmap: buildHourlyHeatmapOption(airHourly),
      pollutantScatter: buildPollutantScatterOption(airHourly),
      riskMatrix: buildRiskMatrixOption(displayAir, airHourly),
      spatialTrend: buildSpatialTrendOption(airHourly),
    }),
    [airHourly, displayAir],
  );

  const tone = aqiTone(displayAir?.aqi ?? 0);

  const trimmedSearchKeyword = searchKeyword.trim();
  const selectedSnapshot = selected ? citySnapshots[selected.cityId] ?? null : null;
  const selectedAlerts: WeatherAlertItem[] = React.useMemo(() => {
    if (Array.isArray(selectedSnapshot?.alerts?.alerts)) return selectedSnapshot.alerts.alerts;
    return Array.isArray(alerts?.alerts) ? alerts.alerts : [];
  }, [alerts?.alerts, selectedSnapshot?.alerts?.alerts]);

  const primaryAlert = pickPrimaryAlert(selectedAlerts);
  const showMapAlert = Boolean(selected && selectedCoord && primaryAlert && selectedAlerts.length > 0);
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

  const rankingRows = React.useMemo((): ScreenRankingItem[] => {
    return cities
      .map((city) => {
        const snapshot = citySnapshots[city.cityId];
        return {
          cityId: city.cityId,
          name: city.name,
          aqi: snapshot?.air?.aqi ?? null,
          alertCount: snapshot?.alerts ? snapshot.alerts.alerts.length : null,
          primary: snapshot?.air?.primary ?? null,
        };
      })
      .filter((row) => row.aqi !== null);
  }, [cities, citySnapshots]);

  const cleanestCities = React.useMemo(
    () => [...rankingRows].sort((a, b) => (a.aqi ?? 999) - (b.aqi ?? 999)).slice(0, 3),
    [rankingRows],
  );
  const rankedByAqi = React.useMemo(
    () => [...rankingRows].sort((a, b) => (a.aqi ?? 0) - (b.aqi ?? 0)),
    [rankingRows],
  );
  const worstAqiCity = React.useMemo(
    () => (rankedByAqi.length > 0 ? rankedByAqi[rankedByAqi.length - 1] : null),
    [rankedByAqi],
  );
  const riskiestCities = React.useMemo(
    () =>
      [...rankingRows]
        .sort(
          (a, b) =>
            ((b.alertCount ?? -1) - (a.alertCount ?? -1)) || ((b.aqi ?? 0) - (a.aqi ?? 0)),
        )
        .slice(0, 3),
    [rankingRows],
  );
  const alertCities = React.useMemo(
    () =>
      [...rankingRows]
        .filter((row) => (row.alertCount ?? 0) > 0)
        .sort(
          (a, b) =>
            ((b.alertCount ?? -1) - (a.alertCount ?? -1)) || ((b.aqi ?? 0) - (a.aqi ?? 0)),
        )
        .slice(0, 3),
    [rankingRows],
  );
  const alertedCitiesCount = React.useMemo(
    () => rankingRows.filter((row) => (row.alertCount ?? 0) > 0).length,
    [rankingRows],
  );
  const currentCompare = React.useMemo<ScreenCompareSummary | null>(
    () => {
      if (!selected) return null;
      return {
        cityName: selected.name,
        aqi: displayAir?.aqi ?? null,
        primary: displayAir?.primary ?? null,
        alertCount: selectedAlerts.length,
      };
    },
    [displayAir?.aqi, displayAir?.primary, selected, selectedAlerts.length],
  );

  const selectedCityId = selected?.cityId ?? null;
  const renderCityMarker = React.useCallback(
    ({ id, name }: { id: string; name: string }): React.ReactNode => {
      const isSelected = Boolean(selectedCityId && id === selectedCityId);
      const snapshot = citySnapshots[id];
      const markerTone = pickMarkerTone(snapshot?.air?.aqi ?? null, snapshot?.alerts?.alerts.length ?? 0);

      return (
        <div className="flex cursor-pointer flex-col items-center gap-1">
          <div
            className={cn(
              'relative grid h-9 w-9 place-items-center rounded-2xl border shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 backdrop-blur-md',
              isSelected
                ? 'border-primary/28 bg-primary/14 text-primary ring-primary/20'
                : markerTone.shellClassName,
            )}
            aria-label={`城市：${name}`}
          >
            <span
              className={cn(
                'pointer-events-none absolute -inset-2 rounded-[20px] blur-md',
                isSelected ? 'bg-primary/12' : markerTone.glowClassName,
              )}
            />
            {!isSelected && markerTone.showPing ? (
              <span className="pointer-events-none absolute -inset-2 rounded-[18px] animate-ping bg-current/20 opacity-70" />
            ) : null}
            {isSelected ? (
              <MapPin className="relative h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Building2
                className={cn('relative h-[18px] w-[18px]', markerTone.iconClassName)}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            )}
          </div>
          <div
            className={cn(
              'relative h-2 w-2 rounded-full shadow-[0_10px_26px_rgba(0,0,0,0.55)] ring-1 ring-white/10',
              isSelected ? 'bg-primary' : markerTone.dotClassName,
            )}
          >
            <span
              className={cn(
                'absolute -inset-2 rounded-full blur-md',
                isSelected ? 'bg-primary/12' : markerTone.glowClassName,
              )}
            />
          </div>
        </div>
      );
    },
    [citySnapshots, selectedCityId],
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

  const mergedSelectableCities = React.useMemo(() => {
    const merged = [...cities, ...favoriteCities, ...(selected ? [selected] : [])];
    const result = new Map<string, CityItem>();
    merged.forEach((city) => {
      result.set(city.cityId, city);
    });
    return result;
  }, [cities, favoriteCities, selected]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0">
        <AMapPanel
          center={selectedCoord}
          markers={mapMarkers}
          renderMarker={renderCityMarker}
          onMarkerClick={(id) => {
            const found = mergedSelectableCities.get(id) ?? null;
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
          <ScreenTopBar
            notices={notices}
            now={now}
            searchOpen={searchOpen}
            isLoggedIn={canManageFavorites}
            replayMode={historyPlayback.replayMode}
            replayLabel={historyPlayback.currentLabel}
            onOpenSearch={openSearch}
          />

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
                air={displayAir}
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

              <ScreenRightPanel
                chartOptions={chartOptions}
                replayMode={historyPlayback.replayMode}
                replayLabel={historyPlayback.currentLabel}
                alertedCitiesCount={alertedCitiesCount}
                cleanestCities={cleanestCities}
                riskiestCities={riskiestCities}
                alertCities={alertCities}
                currentCompare={currentCompare}
                worstAqiCity={worstAqiCity}
              />
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
