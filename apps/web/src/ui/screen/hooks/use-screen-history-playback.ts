import React from 'react';
import type { AirHourlyItem, AirNowItem } from '@air-monitor/shared';

import { formatHourLabel, toNumber } from '@/ui/screen/lib/screen-utils';

type HistoryFrame = {
  time: string;
  label: string;
  snapshot: AirNowItem;
};

type SortableHistoryFrame = HistoryFrame & { ms: number };

type HistoryPlaybackState = {
  replayMode: boolean;
  isPlaying: boolean;
  frames: HistoryFrame[];
  currentIndex: number;
  currentAir: AirNowItem | null;
  currentLabel: string;
  enterReplayMode: () => void;
  exitReplayMode: () => void;
  togglePlaying: () => void;
  setCurrentIndex: (value: number) => void;
};

function getHistoryTime(item: AirHourlyItem): string | null {
  const raw = item as Record<string, unknown>;
  if (typeof raw.fxTime === 'string') return raw.fxTime;
  if (typeof item.pubTime === 'string') return item.pubTime;
  if (typeof raw.updateTime === 'string') return raw.updateTime;
  return null;
}

function buildFrames(hourly: AirHourlyItem[], liveAir: AirNowItem | null): HistoryFrame[] {
  if (!liveAir) return [];

  const frames: SortableHistoryFrame[] = [];

  hourly.forEach((item) => {
    const time = getHistoryTime(item);
    if (!time) return;
    const ms = new Date(time).getTime();
    if (Number.isNaN(ms)) return;

    frames.push({
      ms,
      time,
      label: formatHourLabel(time),
      snapshot: {
        cityId: liveAir.cityId,
        pubTime: time,
        aqi: toNumber(item.aqi) ?? liveAir.aqi,
        level: typeof item.level === 'string' ? item.level : liveAir.level,
        category: typeof item.category === 'string' ? item.category : liveAir.category,
        primary: typeof item.primary === 'string' ? item.primary : liveAir.primary,
        pm10: toNumber(item.pm10) ?? liveAir.pm10,
        pm2p5: toNumber(item.pm2p5) ?? toNumber((item as Record<string, unknown>).pm25) ?? liveAir.pm2p5,
        no2: toNumber(item.no2) ?? liveAir.no2,
        so2: toNumber(item.so2) ?? liveAir.so2,
        co: toNumber(item.co) ?? liveAir.co,
        o3: toNumber(item.o3) ?? liveAir.o3,
      },
    });
  });

  return frames
    .sort((a, b) => a.ms - b.ms)
    .slice(-8)
    .map(({ ms: _ms, ...frame }) => frame);
}

export function useScreenHistoryPlayback(
  airHourly: AirHourlyItem[],
  liveAir: AirNowItem | null,
): HistoryPlaybackState {
  const frames = React.useMemo(() => buildFrames(airHourly, liveAir), [airHourly, liveAir]);
  const [replayMode, setReplayMode] = React.useState<boolean>(false);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);

  React.useEffect(() => {
    if (frames.length === 0) {
      setReplayMode(false);
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(frames.length - 1);
  }, [frames]);

  React.useEffect(() => {
    if (!replayMode || !isPlaying || frames.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((current) => {
        if (current >= frames.length - 1) return 0;
        return current + 1;
      });
    }, 1400);

    return () => window.clearInterval(timer);
  }, [frames.length, isPlaying, replayMode]);

  const enterReplayMode = React.useCallback((): void => {
    if (frames.length === 0) return;
    setReplayMode(true);
    setIsPlaying(false);
    setCurrentIndex(frames.length - 1);
  }, [frames.length]);

  const exitReplayMode = React.useCallback((): void => {
    setReplayMode(false);
    setIsPlaying(false);
    setCurrentIndex(Math.max(0, frames.length - 1));
  }, [frames.length]);

  const togglePlaying = React.useCallback((): void => {
    if (frames.length <= 1) return;
    setIsPlaying((current) => !current);
  }, [frames.length]);

  const currentAir = replayMode ? frames[currentIndex]?.snapshot ?? liveAir : liveAir;
  const currentLabel = replayMode
    ? frames[currentIndex]?.label ?? '回放中'
    : liveAir?.pubTime
      ? formatHourLabel(liveAir.pubTime)
      : '实时';

  return {
    replayMode,
    isPlaying,
    frames,
    currentIndex,
    currentAir,
    currentLabel,
    enterReplayMode,
    exitReplayMode,
    togglePlaying,
    setCurrentIndex,
  };
}
