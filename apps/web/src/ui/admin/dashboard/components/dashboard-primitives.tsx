import React from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { Bell, type LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function EChartsViewport(props: { option: EChartsOption; className?: string }): React.ReactNode {
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = echarts.init(host);
    chart.setOption(props.option, true);
    const onResize = () => chart.resize();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            chart.resize();
          })
        : null;
    resizeObserver?.observe(host);
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => chart.resize());
    return () => {
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      chart.dispose();
    };
  }, [props.option]);

  return <div ref={hostRef} className={props.className} />;
}

export function getChartHeightClass(rowSpan: number): string {
  if (rowSpan >= 2) return 'h-full min-h-0';
  return 'h-[8rem] min-h-[8rem]';
}

export function Metric(props: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
}): React.ReactNode {
  const Icon = props.icon;
  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{props.label}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-slate-800">{props.value}</p>
        <p className="mt-1 text-xs text-slate-400">{props.hint}</p>
      </div>
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${props.iconClassName} shadow-sm`}
      >
        <Icon className="size-5 text-white" strokeWidth={1.8} />
      </div>
    </div>
  );
}

export function MetricSkeleton(): React.ReactNode {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function QuickStats(props: { rows: Array<{ label: string; value: string | number }> }): React.ReactNode {
  return (
    <div className="space-y-2">
      {props.rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-500">{row.label}</span>
          <span className="text-sm font-semibold text-slate-800">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart(props: { rowSpan?: number }): React.ReactNode {
  return <div className={cn('animate-pulse rounded bg-slate-100', getChartHeightClass(props.rowSpan ?? 2))} />;
}

export function SkeletonList(): React.ReactNode {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyPanel(props: { label: string }): React.ReactNode {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-slate-400">
      <Bell className="mb-2 size-8 opacity-30" />
      <p className="text-sm">{props.label}</p>
    </div>
  );
}
