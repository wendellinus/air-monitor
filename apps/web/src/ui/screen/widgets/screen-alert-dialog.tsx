import React from 'react';
import { BellRing, ShieldAlert } from 'lucide-react';
import type { WeatherAlertItem } from '@air-monitor/shared';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { alertSeverityLabel, formatDateTime } from '../lib/screen-utils';
import { getAlertAccentColor, getAlertKind, getAlertKindLabel, pickPrimaryAlert } from './alert-icon';

type ScreenAlertDialogProps = {
  open: boolean;
  cityName: string;
  alerts: WeatherAlertItem[];
  onOpenChange: (open: boolean) => void;
};

function alertSeverityClassName(severity: string | undefined): string {
  const value = (severity ?? '').trim().toLowerCase();
  if (value === 'extreme' || value === 'severe') {
    return 'border-rose-300/20 bg-rose-400/12 text-rose-100';
  }
  if (value === 'moderate') {
    return 'border-amber-300/20 bg-amber-300/12 text-amber-100';
  }
  if (value === 'minor') {
    return 'border-sky-300/20 bg-sky-300/12 text-sky-100';
  }
  return 'border-cyan-200/18 bg-cyan-200/10 text-cyan-100';
}

export function ScreenAlertDialog(props: ScreenAlertDialogProps): React.ReactNode {
  const primaryAlert = React.useMemo(() => pickPrimaryAlert(props.alerts), [props.alerts]);
  const [activeAlertId, setActiveAlertId] = React.useState<string | null>(primaryAlert?.id ?? null);

  React.useEffect(() => {
    if (props.alerts.length === 0) {
      setActiveAlertId(null);
      return;
    }

    if (activeAlertId && props.alerts.some((item) => item.id === activeAlertId)) return;
    setActiveAlertId(primaryAlert?.id ?? props.alerts[0]?.id ?? null);
  }, [activeAlertId, primaryAlert?.id, props.alerts]);

  const activeAlert = React.useMemo(() => {
    if (props.alerts.length === 0) return null;
    return props.alerts.find((item) => item.id === activeAlertId) ?? primaryAlert ?? props.alerts[0] ?? null;
  }, [activeAlertId, primaryAlert, props.alerts]);

  if (!activeAlert) return null;

  const alertKind = getAlertKind(activeAlert);
  const accentColor = getAlertAccentColor(activeAlert);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="overflow-hidden border-white/10 bg-[#07111b]/96 p-0 text-foreground shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:max-w-[760px]">
        <DialogHeader className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(7,17,27,0.94))] px-6 py-5 text-left">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-100/75">
              <BellRing className="h-4 w-4" aria-hidden="true" />
              天气预警详情
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
              {props.cityName} 预警详情
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              点击左侧列表可切换查看不同预警内容。
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[min(78vh,760px)]">
          <div className="border-b border-white/10 bg-black/18">
            <div className="px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              预警列表
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 p-3">
                {props.alerts.map((alert) => {
                  const isActive = alert.id === activeAlert.id;
                  const kind = getAlertKind(alert);

                  return (
                    <button
                      key={alert.id}
                      type="button"
                      className={cn(
                        'w-full rounded-2xl border px-3 py-3 text-left transition-colors',
                        'hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/30',
                        isActive
                          ? 'border-cyan-200/28 bg-cyan-200/10 shadow-[0_12px_30px_rgba(34,211,238,0.08)]'
                          : 'border-white/8 bg-black/18',
                      )}
                      onClick={() => setActiveAlertId(alert.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {alert.eventType?.name ?? '预警'}
                          </div>
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {alert.headline || '未提供标题'}
                          </div>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium',
                            alertSeverityClassName(alert.severity),
                          )}
                        >
                          {alertSeverityLabel(alert.severity)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{getAlertKindLabel(kind)}</span>
                        <span>{formatDateTime(alert.effectiveTime)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <ScrollArea className="h-[min(56vh,520px)]">
            <div className="space-y-6 px-6 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200/18 bg-cyan-200/10 px-3 py-1 text-xs font-medium text-cyan-100">
                  {getAlertKindLabel(alertKind)}
                </span>
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium',
                    alertSeverityClassName(activeAlert.severity),
                  )}
                >
                  严重程度：{alertSeverityLabel(activeAlert.severity)}
                </span>
                {accentColor ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/85"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-white/15"
                      style={{ backgroundColor: accentColor }}
                    />
                    预警颜色
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-2xl border border-rose-300/16 bg-rose-300/10 p-2 text-rose-100">
                    <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-semibold leading-tight text-foreground">
                      {activeAlert.headline || `${props.cityName} 预警`}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {activeAlert.eventType?.name ?? '预警'}，请留意生效时间与防御指引。
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/22 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">生效时间</div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {formatDateTime(activeAlert.effectiveTime)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/22 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">结束时间</div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {formatDateTime(activeAlert.expireTime)}
                    </div>
                  </div>
                </div>
              </div>

              <section className="rounded-3xl border border-white/8 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">预警说明</div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/92">
                  {activeAlert.description || '暂无详细说明。'}
                </div>
              </section>

              <section className="rounded-3xl border border-white/8 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">防御指引</div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/92">
                  {activeAlert.instruction || '当前预警未提供防御指引，请结合官方通告谨慎出行。'}
                </div>
                  </section>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
