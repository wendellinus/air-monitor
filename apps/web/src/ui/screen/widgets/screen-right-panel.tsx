import React from 'react';
import * as echarts from 'echarts';
import {
  AlertTriangle,
  Building2,
  CloudFog,
  CloudRain,
  MapPin,
  Snowflake,
  SunMedium,
  Tornado,
  Zap,
} from 'lucide-react';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { getAlertKindLabel } from './alert-icon';
import { ScreenGlassCard } from './screen-glass-card';

function LegendItem(props: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}): React.ReactNode {
  const hasDescription = Boolean(props.description);
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-white/8 bg-black/10 ring-1 ring-white/8',
        hasDescription ? 'items-start p-3' : 'items-center px-3 py-2',
      )}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-xl border border-white/8 bg-black/14 text-foreground/90 ring-1 ring-white/8',
          hasDescription ? 'h-9 w-9' : 'h-8 w-8',
        )}
      >
        {props.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-none text-foreground">{props.title}</div>
        {hasDescription ? (
          <div className="mt-1 text-xs leading-snug text-muted-foreground">{props.description}</div>
        ) : null}
      </div>
    </div>
  );
}

function EChartPanel(props: {
  title: string;
  description?: string;
  option: echarts.EChartsOption;
  cardClassName?: string;
  chartClassName?: string;
}): React.ReactNode {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.setOption(props.option);
    let disposed = false;
    const onResize = () => chart.resize();
    requestAnimationFrame(() => {
      if (disposed) return;
      chart.resize();
    });
    window.addEventListener('resize', onResize);
    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [props.option]);

  return (
    <ScreenGlassCard className={props.cardClassName}>
      <CardHeader className="gap-2">
        <CardTitle className="text-base">{props.title}</CardTitle>
        {props.description ? <div className="text-sm text-muted-foreground">{props.description}</div> : null}
      </CardHeader>
      <CardContent className="pt-2">
        <div ref={ref} className={cn('h-[clamp(150px,22vh,230px)] w-full', props.chartClassName)} />
      </CardContent>
    </ScreenGlassCard>
  );
}

type ScreenRightPanelProps = {
  trendOption: echarts.EChartsOption;
  pollutantOption: echarts.EChartsOption;
};

export function ScreenRightPanel(props: ScreenRightPanelProps): React.ReactNode {
  return (
    <div className="pointer-events-auto absolute top-0 right-2 bottom-0 w-[400px] min-h-0">
      <div
        className="h-full"
        onWheelCapture={(e) => e.stopPropagation()}
        onTouchMoveCapture={(e) => e.stopPropagation()}
      >
        <ScrollArea className="h-full" data-panel="right">
          <div className="flex min-h-full flex-col gap-3 pl-2 pr-2">
            <EChartPanel
              title="AQI 趋势"
              description="最近 5 个小时"
              option={props.trendOption}
              cardClassName="bg-black/6 ring-white/10 border-white/16 p-4 rounded-[8px]"
            />
            <EChartPanel
              title="污染物浓度"
              description="当前主要污染物"
              option={props.pollutantOption}
              cardClassName="bg-black/6 ring-white/10 border-white/16 p-4 rounded-[8px]"
            />
            <ScreenGlassCard className="bg-black/6 ring-white/10 border-white/16 p-4 rounded-[8px]">
              <CardHeader className="gap-2 pb-4">
                <CardTitle className="text-base">图例</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-2xl border border-white/8 bg-black/6 ring-1 ring-white/8">
                  <ScrollArea className="h-[260px] pr-2">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      <LegendItem
                        icon={<Building2 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title="热门城市"
                      />
                      <LegendItem
                        icon={<MapPin className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title="定位"
                      />
                      <LegendItem
                        icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title="预警"
                      />
                      <LegendItem
                        icon={<Tornado className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title={getAlertKindLabel('typhoon')}
                      />
                      <LegendItem
                        icon={<CloudRain className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title={getAlertKindLabel('rain')}
                      />
                      <LegendItem
                        icon={<Zap className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title={getAlertKindLabel('thunder')}
                      />
                      <LegendItem
                        icon={<SunMedium className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title={getAlertKindLabel('heat')}
                      />
                      <LegendItem
                        icon={<Snowflake className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title={getAlertKindLabel('cold')}
                      />
                      <LegendItem
                        icon={<CloudFog className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title={getAlertKindLabel('fog')}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </ScreenGlassCard>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
