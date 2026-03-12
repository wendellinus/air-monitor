import React from 'react';
import * as echarts from 'echarts';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CloudFog,
  CloudRain,
  Gauge,
  Layers3,
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

type ChartCategory = 'overview' | 'distribution' | 'analysis' | 'legend';
type ChartKey =
  | 'aqiLine'
  | 'aqiArea'
  | 'aqiCombo'
  | 'aqiGauge'
  | 'aqiRing'
  | 'pollutantBar'
  | 'pollutantStacked'
  | 'pollutantPie'
  | 'pollutantRadar'
  | 'aqiBoxplot'
  | 'hourlyHeatmap'
  | 'pollutantScatter'
  | 'riskMatrix'
  | 'spatialTrend';

export type ScreenChartOptions = Record<ChartKey, echarts.EChartsOption>;
export type ScreenRankingItem = {
  cityId: string;
  name: string;
  aqi: number | null;
  alertCount: number | null;
  primary: string | null;
};

export type ScreenCompareSummary = {
  cityName: string;
  aqi: number | null;
  primary: string | null;
  alertCount: number | null;
};

function LegendItem(props: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}): React.ReactNode {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-white/8 bg-black/10 ring-1 ring-white/8',
        props.description ? 'items-start p-3' : 'items-center px-3 py-2.5',
      )}
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-xl border border-white/8 bg-black/14 text-foreground/90 ring-1 ring-white/8',
          props.description ? 'h-9 w-9' : 'h-8 w-8',
        )}
      >
        {props.icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-none text-foreground">{props.title}</div>
        {props.description ? (
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
}): React.ReactNode {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.setOption(props.option, true);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(() => chart.resize());
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [props.option]);

  return (
    <ScreenGlassCard className="overflow-hidden rounded-[12px] border-white/16 bg-black/8 p-3 ring-white/10">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-base leading-none">{props.title}</CardTitle>
        {props.description ? (
          <div className="text-xs leading-5 text-muted-foreground">{props.description}</div>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={ref} className="h-[360px] w-full min-w-0" />
      </CardContent>
    </ScreenGlassCard>
  );
}

function SummaryTile(props: {
  icon: React.ReactNode;
  title: string;
  value: string;
}): React.ReactNode {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3 ring-1 ring-white/8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/8 bg-black/14 text-foreground/90">
          {props.icon}
        </span>
        <span className="text-xs">{props.title}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{props.value}</div>
    </div>
  );
}

function RankingBoard(props: {
  title: string;
  accentClassName: string;
  emptyText: string;
  rows: ScreenRankingItem[];
}): React.ReactNode {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-3 ring-1 ring-white/8">
      <div className={cn('text-xs font-semibold uppercase tracking-[0.24em]', props.accentClassName)}>
        {props.title}
      </div>
      <div className="mt-3 space-y-2">
        {props.rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-xs text-muted-foreground">
            {props.emptyText}
          </div>
        ) : (
          props.rows.map((row, index) => (
            <div
              key={row.cityId}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-black/14 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/8 text-[11px] text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate">{row.name}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {row.primary ? `主污染物 ${row.primary}` : '主污染物未提供'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">{row.aqi ?? '-'}</div>
                <div className="text-[11px] text-muted-foreground">
                  {row.alertCount === null
                    ? '天气预警待同步'
                    : row.alertCount > 0
                      ? `天气预警 ${row.alertCount}`
                      : '无天气预警'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CompareInsightCard(props: {
  current: ScreenCompareSummary | null;
  best: ScreenRankingItem | null;
  worst: ScreenRankingItem | null;
}): React.ReactNode {
  const currentAqi = props.current?.aqi ?? null;
  const bestAqi = props.best?.aqi ?? null;
  const worstAqi = props.worst?.aqi ?? null;
  const deltaToBest = currentAqi !== null && bestAqi !== null ? currentAqi - bestAqi : null;
  const deltaToWorst = currentAqi !== null && worstAqi !== null ? currentAqi - worstAqi : null;

  return (
    <ScreenGlassCard className="rounded-[12px] border-white/16 bg-black/8 p-3 ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">对比分析</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            点击地图或左侧城市后，这里会自动刷新当前城市的空气质量结论。
          </div>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-100">
          自动更新
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/8 bg-black/12 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{props.current?.cityName ?? '当前城市'}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {props.current?.primary ? `主污染物 ${props.current.primary}` : '主污染物未提供'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold text-foreground">{currentAqi ?? '-'}</div>
            <div className="text-[11px] text-muted-foreground">当前 AQI</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-2.5">
          <div className="text-muted-foreground">较最佳 AQI</div>
          <div className="mt-1 font-semibold text-foreground">
            {deltaToBest !== null ? `${deltaToBest >= 0 ? '+' : ''}${deltaToBest}` : '-'}
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-2.5">
          <div className="text-muted-foreground">较最差 AQI</div>
          <div className="mt-1 font-semibold text-foreground">
            {deltaToWorst !== null ? `${deltaToWorst >= 0 ? '+' : ''}${deltaToWorst}` : '-'}
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
        <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-2.5">
          <div className="text-muted-foreground">天气预警</div>
          <div className="mt-1 font-semibold text-foreground">
            {(props.current?.alertCount ?? null) === null
              ? '待同步'
              : (props.current?.alertCount ?? 0) > 0
                ? `${props.current?.alertCount ?? 0} 条`
                : '暂无'}
          </div>
        </div>
      </div>
    </ScreenGlassCard>
  );
}

type ScreenRightPanelProps = {
  chartOptions: ScreenChartOptions;
  replayMode: boolean;
  replayLabel: string;
  alertedCitiesCount: number;
  cleanestCities: ScreenRankingItem[];
  riskiestCities: ScreenRankingItem[];
  alertCities: ScreenRankingItem[];
  currentCompare: ScreenCompareSummary | null;
  worstAqiCity: ScreenRankingItem | null;
};

const chartCatalog: Array<{
  key: ChartKey;
  category: Exclude<ChartCategory, 'legend'>;
  title: string;
  description: string;
}> = [
  { key: 'aqiLine', category: 'overview', title: 'AQI 折线图', description: '查看最近小时级 AQI 趋势。' },
  { key: 'aqiArea', category: 'overview', title: 'AQI 面积图', description: '用面积强调 AQI 波动区间。' },
  { key: 'aqiCombo', category: 'overview', title: 'AQI 组合图', description: '将 PM2.5 与 AQI 放在同一视图中。' },
  { key: 'aqiGauge', category: 'overview', title: '数字仪表盘', description: '展示当前 AQI 与等级。' },
  { key: 'aqiRing', category: 'overview', title: '进度环', description: '观察 AQI 在当前区间中的占比。' },
  { key: 'pollutantBar', category: 'distribution', title: '污染物柱状图', description: '横向对比主要污染物数值。' },
  { key: 'pollutantStacked', category: 'distribution', title: '污染物堆叠图', description: '查看小时级污染物构成变化。' },
  { key: 'pollutantPie', category: 'distribution', title: '污染物饼图', description: '展示当前污染物结构占比。' },
  { key: 'pollutantRadar', category: 'distribution', title: '污染物雷达图', description: '从多维角度观察污染结构。' },
  { key: 'aqiBoxplot', category: 'distribution', title: 'AQI 箱型图', description: '查看 AQI 的分位波动情况。' },
  { key: 'hourlyHeatmap', category: 'analysis', title: '小时热力图', description: '按小时观察关键指标热区。' },
  { key: 'pollutantScatter', category: 'analysis', title: '污染物散点图', description: '查看 PM2.5 与 O3 的相关性。' },
  { key: 'riskMatrix', category: 'analysis', title: '风险矩阵', description: '从影响与波动角度查看风险。' },
  { key: 'spatialTrend', category: 'analysis', title: '空间趋势图', description: '用更立体的形式表达趋势。' },
];

export function ScreenRightPanel(props: ScreenRightPanelProps): React.ReactNode {
  const [activeCategory, setActiveCategory] = React.useState<ChartCategory>('overview');
  const [activeChartKey, setActiveChartKey] = React.useState<ChartKey>('aqiLine');

  const categoryTabs: Array<{
    value: ChartCategory;
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: 'overview', label: '总览', icon: <Gauge className="h-4 w-4" /> },
    { value: 'distribution', label: '分布', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'analysis', label: '分析', icon: <Activity className="h-4 w-4" /> },
    { value: 'legend', label: '图例', icon: <Layers3 className="h-4 w-4" /> },
  ];

  const visibleCharts = React.useMemo(
    () => chartCatalog.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  React.useEffect(() => {
    if (activeCategory === 'legend') return;
    if (!visibleCharts.some((item) => item.key === activeChartKey)) {
      setActiveChartKey(visibleCharts[0]?.key ?? 'aqiLine');
    }
  }, [activeCategory, activeChartKey, visibleCharts]);

  const activeChart = visibleCharts.find((item) => item.key === activeChartKey) ?? visibleCharts[0] ?? null;

  return (
    <div className="pointer-events-auto absolute bottom-0 right-2 top-0 w-[500px] min-h-0">
      <div
        className="h-full"
        onWheelCapture={(event) => event.stopPropagation()}
        onTouchMoveCapture={(event) => event.stopPropagation()}
      >
        <ScrollArea className="h-full" data-panel="right">
          <div className="flex min-h-full flex-col gap-3 px-2 pb-2">
            <ScreenGlassCard className="rounded-[12px] border-white/16 bg-black/8 p-3 ring-white/10">
              <div className="grid grid-cols-3 gap-2">
                <SummaryTile icon={<Gauge className="h-4 w-4" />} title="图表目录" value="14 种图形" />
                <SummaryTile
                  icon={<Activity className="h-4 w-4" />}
                  title="当前模式"
                  value={props.replayMode ? `历史回放 ${props.replayLabel}` : '实时联动'}
                />
                <SummaryTile
                  icon={<Layers3 className="h-4 w-4" />}
                  title="天气预警城市"
                  value={`${props.alertedCitiesCount} 座`}
                />
              </div>
            </ScreenGlassCard>

            <CompareInsightCard
              current={props.currentCompare}
              best={props.cleanestCities[0] ?? null}
              worst={props.worstAqiCity}
            />

            <ScreenGlassCard className="rounded-[12px] border-white/16 bg-black/8 p-3 ring-white/10">
              <div className="grid gap-3">
                <RankingBoard
                  title="最佳 AQI"
                  accentClassName="text-emerald-200"
                  emptyText="当前没有可计算的最佳 AQI 城市。"
                  rows={props.cleanestCities}
                />
                <RankingBoard
                  title="风险最高"
                  accentClassName="text-rose-200"
                  emptyText="当前没有可计算的高风险城市。"
                  rows={props.riskiestCities}
                />
                <RankingBoard
                  title="天气预警聚焦"
                  accentClassName="text-amber-200"
                  emptyText="当前热门城市中暂无天气预警。"
                  rows={props.alertCities}
                />
              </div>
            </ScreenGlassCard>

            <ScreenGlassCard className="rounded-[12px] border-white/16 bg-black/8 p-3 ring-white/10">
              <div className="grid grid-cols-4 gap-2">
                {categoryTabs.map((tab) => {
                  const active = activeCategory === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveCategory(tab.value)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm transition-colors',
                        active
                          ? 'border-cyan-300/25 bg-cyan-300/12 text-foreground ring-1 ring-cyan-300/18'
                          : 'border-white/8 bg-black/10 text-muted-foreground ring-1 ring-white/8 hover:bg-white/6 hover:text-foreground/90',
                      )}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </ScreenGlassCard>

            {activeCategory !== 'legend' ? (
              <ScreenGlassCard className="rounded-[12px] border-white/16 bg-black/8 p-3 ring-white/10">
                <div className="grid grid-cols-3 gap-2">
                  {visibleCharts.map((chart) => {
                    const active = activeChartKey === chart.key;
                    return (
                      <button
                        key={chart.key}
                        type="button"
                        title={chart.title}
                        onClick={() => setActiveChartKey(chart.key)}
                        className={cn(
                          'min-h-10 rounded-2xl border px-3 py-2 text-sm leading-tight transition-colors',
                          active
                            ? 'border-cyan-300/25 bg-cyan-300/12 text-foreground ring-1 ring-cyan-300/18'
                            : 'border-white/8 bg-black/10 text-muted-foreground ring-1 ring-white/8 hover:bg-white/6 hover:text-foreground/90',
                        )}
                      >
                        <span className="line-clamp-2">{chart.title}</span>
                      </button>
                    );
                  })}
                </div>
              </ScreenGlassCard>
            ) : null}

            {activeCategory !== 'legend' && activeChart ? (
              <div className="pb-2">
                <EChartPanel
                  title={activeChart.title}
                  description={activeChart.description}
                  option={props.chartOptions[activeChart.key]}
                />
              </div>
            ) : null}

            {activeCategory === 'legend' ? (
              <ScreenGlassCard className="rounded-[12px] border-white/16 bg-black/8 p-4 ring-white/10">
                <CardHeader className="gap-2 pb-4">
                  <CardTitle className="text-base">图例总览</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    地图高亮、回放状态和右侧图表都在这里统一解释，方便演示时快速说明界面含义。
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      地图元素
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <LegendItem
                        icon={<Building2 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title="热门城市"
                        description="作为大屏主要观测对象，可以直接切换分析城市。"
                      />
                      <LegendItem
                        icon={<MapPin className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title="当前选中"
                        description="当前聚焦城市会高亮，并同步左侧卡片和右侧图表。"
                      />
                      <LegendItem
                        icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />}
                        title="预警高亮"
                        description="存在天气预警或高 AQI 风险时，地图点位会出现更强的光圈与动效。"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      预警类型
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <LegendItem icon={<Tornado className="h-5 w-5" />} title={getAlertKindLabel('typhoon')} />
                      <LegendItem icon={<CloudRain className="h-5 w-5" />} title={getAlertKindLabel('rain')} />
                      <LegendItem icon={<Zap className="h-5 w-5" />} title={getAlertKindLabel('thunder')} />
                      <LegendItem icon={<SunMedium className="h-5 w-5" />} title={getAlertKindLabel('heat')} />
                      <LegendItem icon={<Snowflake className="h-5 w-5" />} title={getAlertKindLabel('cold')} />
                      <LegendItem icon={<CloudFog className="h-5 w-5" />} title={getAlertKindLabel('fog')} />
                    </div>
                  </div>
                </CardContent>
              </ScreenGlassCard>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
