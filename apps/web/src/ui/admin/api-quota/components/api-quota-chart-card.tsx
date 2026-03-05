import React from 'react';
import * as echarts from 'echarts';
import { Activity, PieChart } from 'lucide-react';
import type { EChartsOption } from 'echarts';
import type { ProviderTrendData } from '@air-monitor/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { type ChartType } from '@/ui/admin/api-quota/lib/api-quota';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function EChartsViewport(props: { option: EChartsOption; className?: string }): React.ReactNode {
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const chart = echarts.init(host, undefined, { renderer: 'canvas' });
    chart.setOption(props.option, true);

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => chart.resize());

    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [props.option]);

  return <div ref={hostRef} className={props.className} />;
}

type ApiQuotaChartCardProps = {
  t: TranslateFn;
  metricName: string;
  chartType: ChartType;
  onChartTypeChange: (nextType: ChartType) => void;
  activeChartOption: EChartsOption;
  showRefreshing: boolean;
  trends: ProviderTrendData | undefined;
  trendsLoading: boolean;
};

export function ApiQuotaChartCard(props: ApiQuotaChartCardProps): React.ReactNode {
  const { t } = props;

  return (
    <Card className="min-h-0 overflow-hidden">
      <CardHeader className="border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {t('admin.apiQuota.chartTitle', { metric: props.metricName })}
            </CardTitle>
            <CardDescription>{t('admin.apiQuota.chartDesc')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={props.chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => props.onChartTypeChange('line')}
            >
              {t('admin.apiQuota.chartType.line')}
            </Button>
            <Button
              variant={props.chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => props.onChartTypeChange('bar')}
            >
              {t('admin.apiQuota.chartType.bar')}
            </Button>
            <Button
              variant={props.chartType === 'donut' ? 'default' : 'outline'}
              size="sm"
              onClick={() => props.onChartTypeChange('donut')}
            >
              <PieChart className="mr-2 h-4 w-4" />
              {t('admin.apiQuota.chartType.donut')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative h-full min-h-0 p-4 md:p-5">
        {props.showRefreshing ? (
          <div className="pointer-events-none absolute right-5 top-4 z-10 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
            <Spinner className="h-3.5 w-3.5" />
            <span>{t('admin.common.refreshing')}</span>
          </div>
        ) : null}

        {!props.trends && props.trendsLoading && props.chartType !== 'donut' ? (
          <div className="grid h-full min-h-[300px] place-items-center">
            <Skeleton className="h-[94%] w-full" />
          </div>
        ) : (
          <EChartsViewport option={props.activeChartOption} className="h-full min-h-[320px] w-full" />
        )}

        {!props.trendsLoading &&
        props.chartType !== 'donut' &&
        (props.trends?.series ?? []).every((item) => item.points.length === 0) ? (
          <div className="mt-4">
            <Empty>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>{t('admin.apiQuota.emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('admin.apiQuota.emptyDesc')}</EmptyDescription>
            </Empty>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
