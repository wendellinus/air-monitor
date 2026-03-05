import React from 'react';
import {
  AlertTriangle,
  CloudFog,
  CloudRain,
  Snowflake,
  SunMedium,
  Tornado,
  Zap,
} from 'lucide-react';
import type { WeatherAlertItem } from '@air-monitor/shared';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

import { alertSeverityLabel, formatDateTime } from '../lib/screen-utils';
import { getAlertKindLabel, type AlertKind } from './alert-icon';

function AlertKindIcon(props: { kind: AlertKind; className?: string }): React.ReactNode {
  const Icon = (() => {
    switch (props.kind) {
      case 'typhoon':
        return Tornado;
      case 'rain':
        return CloudRain;
      case 'thunder':
        return Zap;
      case 'heat':
        return SunMedium;
      case 'cold':
        return Snowflake;
      case 'fog':
        return CloudFog;
      case 'default':
      default:
        return AlertTriangle;
    }
  })();

  return <Icon className={cn('h-5 w-5', props.className)} strokeWidth={2.2} aria-hidden="true" />;
}

type ScreenMapAlertMarkerProps = {
  cityName: string;
  selectedAlerts: WeatherAlertItem[];
  primaryAlert: WeatherAlertItem;
  mapAlertKind: AlertKind;
  mapAlertColor: string | null;
  mapAlertToneClassName: string;
};

export function ScreenMapAlertMarker(props: ScreenMapAlertMarkerProps): React.ReactNode {
  return (
    <HoverCard openDelay={250} closeDelay={180}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            'group relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-md transition-transform hover:scale-105',
            props.mapAlertToneClassName,
          )}
          style={props.mapAlertColor ? { color: props.mapAlertColor } : undefined}
          aria-label={`${props.cityName} 预警 ${props.selectedAlerts.length} 条：${
            props.primaryAlert.headline ?? ''
          }`}
        >
          <div className="flex flex-col items-center leading-none">
            <AlertKindIcon kind={props.mapAlertKind} className="h-[18px] w-[18px]" />
            <span className="mt-0.5 text-[10px] font-semibold">
              {getAlertKindLabel(props.mapAlertKind)}
            </span>
          </div>
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-black/70 px-1 text-[11px] font-semibold text-foreground ring-1 ring-white/15">
            {props.selectedAlerts.length}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        sideOffset={10}
        className="z-[9999] w-[420px] max-w-[min(420px,calc(100vw-24px))] border-white/8 bg-black/50 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.50)] ring-1 ring-white/10 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {props.cityName}
              <span className="mx-2 text-muted-foreground">·</span>
              {props.primaryAlert.eventType?.name ?? '预警'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              严重程度：{alertSeverityLabel(props.primaryAlert.severity)}
              <span className="mx-2">·</span>共 {props.selectedAlerts.length} 条
            </div>
          </div>
          <div
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs ring-1',
              props.mapAlertToneClassName,
              'ring-white/10',
            )}
          >
            {getAlertKindLabel(props.mapAlertKind)}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="text-sm font-medium leading-snug text-foreground">
            {props.primaryAlert.headline}
          </div>
          <div className="text-xs text-muted-foreground">
            生效：{formatDateTime(props.primaryAlert.effectiveTime)}
            <span className="mx-2">·</span>
            结束：{formatDateTime(props.primaryAlert.expireTime)}
          </div>
          <div className="max-h-[240px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {props.primaryAlert.description}
          </div>
          {props.primaryAlert.instruction ? (
            <div className="rounded-md border border-white/8 bg-black/20 p-3 text-sm text-foreground/90">
              <div className="mb-1 text-xs font-semibold text-muted-foreground">防御指引</div>
              <div className="whitespace-pre-wrap">{props.primaryAlert.instruction}</div>
            </div>
          ) : null}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
