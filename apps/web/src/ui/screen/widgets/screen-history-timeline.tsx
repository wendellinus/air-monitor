import React from 'react';
import { Pause, Play, Rewind, Waves } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ScreenHistoryTimelineProps = {
  replayMode: boolean;
  isPlaying: boolean;
  currentIndex: number;
  frames: Array<{ label: string; time: string }>;
  onEnterReplayMode: () => void;
  onExitReplayMode: () => void;
  onTogglePlaying: () => void;
  onSeek: (value: number) => void;
};

export function ScreenHistoryTimeline(props: ScreenHistoryTimelineProps): React.ReactNode {
  const disabled = props.frames.length <= 1;
  const currentFrame = props.frames[props.currentIndex] ?? null;

  return (
    <div className="pointer-events-auto mx-auto w-[min(960px,calc(100vw-2rem))] rounded-[26px] border border-white/12 bg-black/42 px-4 py-3 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)] ring-1 ring-white/10 backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          {!props.replayMode ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full border-white/15 bg-white/12 text-white hover:bg-white/18"
              onClick={props.onEnterReplayMode}
              disabled={disabled}
            >
              <Rewind className="size-4" />
              历史回放
            </Button>
          ) : (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full border-white/15 bg-cyan-400/14 text-white hover:bg-cyan-400/20"
                onClick={props.onTogglePlaying}
                disabled={disabled}
              >
                {props.isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                {props.isPlaying ? '暂停回放' : '播放回放'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full border-white/15 bg-transparent text-white/88 hover:bg-white/10"
                onClick={props.onExitReplayMode}
              >
                退出回放
              </Button>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-medium text-white/70 lg:inline-flex">
            <Waves className="mr-1.5 size-3.5" />
            {props.replayMode ? '回放模式' : '实时模式'}
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(0, props.frames.length - 1)}
            step={1}
            value={props.currentIndex}
            disabled={!props.replayMode || disabled}
            onChange={(event) => props.onSeek(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-cyan-300 disabled:cursor-not-allowed"
          />

          <div className="min-w-[7rem] text-right">
            <div className="text-sm font-semibold text-white">{currentFrame?.label ?? '实时'}</div>
            <div className="text-[11px] text-white/60">{currentFrame?.time ?? '当前时刻'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
