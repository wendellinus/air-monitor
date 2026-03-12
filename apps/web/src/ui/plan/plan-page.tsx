import React from 'react';
import { AlertTriangle, BarChart3, LineChart, MapPinned, Radar, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EChartsViewport } from '@/ui/admin/dashboard/components/dashboard-primitives';
import { useCityCompareData } from '@/ui/plan/hooks/use-city-compare-data';
import {
  buildCompareBarOption,
  buildCompareRadarOption,
  buildCompareTrendOption,
} from '@/ui/plan/lib/plan-charts';
import { AMapPanel } from '@/ui/screen/widgets/amap-panel';
import { aqiTone, formatDateTime, toNumber } from '@/ui/screen/lib/screen-utils';

function CompareMetric(props: { label: string; value: string; hint?: string }): React.ReactNode {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/78 px-4 py-3 shadow-sm shadow-slate-200/35">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-slate-500">{props.hint}</div> : null}
    </div>
  );
}

function ChartCard(props: {
  title: string;
  description: string;
  option: React.ComponentProps<typeof EChartsViewport>['option'];
  icon: React.ReactNode;
}): React.ReactNode {
  return (
    <Card className="rounded-[28px] border-slate-200/85 bg-white/85 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.32)] backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-lg text-slate-900">{props.title}</CardTitle>
          <CardDescription className="mt-1 text-sm leading-6 text-slate-500">{props.description}</CardDescription>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl border border-sky-200/80 bg-sky-50 text-sky-700">
          {props.icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <EChartsViewport option={props.option} className="h-[340px] w-full" />
      </CardContent>
    </Card>
  );
}

export function PlanPage(): React.ReactNode {
  const {
    cityOptions,
    selectedCityIds,
    selectedDatasets,
    focusedCityId,
    loadingCities,
    loadingDatasets,
    error,
    toggleCitySelection,
    setFocusedCityId,
  } = useCityCompareData();

  const focusedDataset = React.useMemo(
    () => selectedDatasets.find((item) => item.city.cityId === focusedCityId) ?? selectedDatasets[0] ?? null,
    [focusedCityId, selectedDatasets],
  );

  const averageAqi = React.useMemo(() => {
    const values = selectedDatasets
      .map((item) => item.airNow?.aqi ?? null)
      .filter((item): item is number => typeof item === 'number');
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [selectedDatasets]);

  const activeAlerts = React.useMemo(
    () => selectedDatasets.reduce((sum, item) => sum + (item.alerts?.alerts.length ?? 0), 0),
    [selectedDatasets],
  );

  const focusedCenter = React.useMemo(() => {
    if (!focusedDataset) return null;
    const lon = toNumber(focusedDataset.city.lon);
    const lat = toNumber(focusedDataset.city.lat);
    if (lon === null || lat === null) return null;
    return { lon, lat };
  }, [focusedDataset]);

  const markers = React.useMemo(
    () =>
      selectedDatasets
        .map((item) => {
          const lon = toNumber(item.city.lon);
          const lat = toNumber(item.city.lat);
          if (lon === null || lat === null) return null;
          return { id: item.city.cityId, name: item.city.name, lon, lat };
        })
        .filter((item): item is { id: string; name: string; lon: number; lat: number } => item !== null),
    [selectedDatasets],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_48%,_#f5f8fc_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-6 py-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-slate-200/85 bg-white/75 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.42)] backdrop-blur">
          <div className="relative overflow-hidden px-6 py-6 lg:px-8">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-200/35 blur-3xl" />
            <div className="absolute left-1/3 top-0 h-40 w-40 rounded-full bg-cyan-200/25 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  <Sparkles className="size-3.5" />
                  P0 可视化分析台
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">
                  城市空气质量对比分析
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 lg:text-base">
                  选择 2 到 4 个热门城市，直接观察 AQI、污染物结构、小时趋势和预警状态差异。这个页面专门用于答辩演示“多维分析能力”。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl px-5">
                  <a href="/screen">进入演示大屏</a>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl px-5">
                  <a href="/admin">返回后台首页</a>
                </Button>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
              <CompareMetric
                label="对比城市"
                value={`${selectedCityIds.length} / 4`}
                hint="至少保留 2 个城市，最多展示 4 个城市"
              />
              <CompareMetric
                label="平均 AQI"
                value={averageAqi !== null ? String(averageAqi) : '-'}
                hint="基于当前已选城市的实时 AQI 平均值"
              />
              <CompareMetric
                label="活跃预警"
                value={String(activeAlerts)}
                hint="统计已选城市中的当前预警条数"
              />
              <CompareMetric
                label="更新时刻"
                value={focusedDataset?.airNow?.pubTime ? formatDateTime(focusedDataset.airNow.pubTime) : '-'}
                hint="聚焦城市的最新监测发布时间"
              />
            </div>
          </div>
        </div>

        <Card className="rounded-[28px] border-slate-200/85 bg-white/84 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.32)] backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900">城市选择</CardTitle>
            <CardDescription className="text-sm text-slate-500">
              首屏默认选中 3 个热门城市。点击可加入或移出对比；再次点击城市卡片可以切换地图聚焦。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {loadingCities
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-11 w-28 animate-pulse rounded-2xl bg-slate-100" />
                ))
              : cityOptions.map((city) => {
                  const selected = selectedCityIds.includes(city.cityId);
                  const locked = !selected && selectedCityIds.length >= 4;
                  return (
                    <button
                      key={city.cityId}
                      type="button"
                      disabled={locked}
                      onClick={() => toggleCitySelection(city.cityId)}
                      className={[
                        'rounded-2xl border px-4 py-2 text-sm font-medium transition-all',
                        selected
                          ? 'border-sky-300 bg-sky-50 text-sky-800 shadow-sm shadow-sky-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                        locked ? 'cursor-not-allowed opacity-45' : '',
                      ].join(' ')}
                    >
                      {city.name}
                    </button>
                  );
                })}
          </CardContent>
        </Card>

        {error ? (
          <Card className="rounded-[24px] border-rose-200 bg-rose-50/90 shadow-sm">
            <CardContent className="flex items-center gap-3 px-5 py-4 text-sm text-rose-700">
              <AlertTriangle className="size-4" />
              {error}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
          <Card className="overflow-hidden rounded-[28px] border-slate-200/85 bg-white/84 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.32)] backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-900">空间分布总览</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                地图聚焦当前选中的对比城市，点击城市卡片即可切换聚焦对象。
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[430px] overflow-hidden rounded-[22px] border border-slate-200/80">
                <AMapPanel
                  center={focusedCenter}
                  markers={markers}
                  onMarkerClick={setFocusedCityId}
                  mapStyle="amap://styles/light"
                  renderMarker={({ id, name }) => {
                    const active = id === focusedCityId;
                    return (
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={[
                            'relative grid h-10 w-10 place-items-center rounded-2xl border shadow-[0_18px_40px_rgba(15,23,42,0.24)] backdrop-blur-sm',
                            active
                              ? 'border-sky-400/70 bg-sky-500 text-white'
                              : 'border-slate-300/80 bg-white/90 text-sky-700',
                          ].join(' ')}
                        >
                          <MapPinned className="size-4.5" strokeWidth={2.1} />
                        </div>
                        <div className="rounded-full bg-slate-950/75 px-2 py-0.5 text-[11px] font-medium text-white">
                          {name}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            {selectedDatasets.map((dataset) => {
              const tone = aqiTone(dataset.airNow?.aqi ?? 0);
              const selected = dataset.city.cityId === focusedCityId;
              return (
                <button
                  key={dataset.city.cityId}
                  type="button"
                  onClick={() => setFocusedCityId(dataset.city.cityId)}
                  className={[
                    'rounded-[26px] border p-0 text-left transition-transform hover:-translate-y-0.5',
                    selected
                      ? 'border-sky-300 bg-sky-50/75 shadow-[0_20px_50px_-30px_rgba(14,165,233,0.48)]'
                      : 'border-slate-200/85 bg-white/84 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.24)]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
                    <div>
                      <div className="text-lg font-semibold text-slate-950">{dataset.city.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {dataset.city.adm1}
                        {dataset.city.adm2 ? ` / ${dataset.city.adm2}` : ''}
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600">
                      {dataset.alerts?.alerts.length ?? 0} 条预警
                    </div>
                  </div>

                  <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-slate-200/80">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">AQI</div>
                      <div className="mt-2 text-3xl font-semibold text-slate-950">{dataset.airNow?.aqi ?? '-'}</div>
                      <div className={`mt-1 text-xs font-semibold ${tone.className}`}>{tone.label}</div>
                    </div>
                    <div className="rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-slate-200/80">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">污染物</div>
                      <div className="mt-2 text-lg font-semibold text-slate-950">{dataset.airNow?.primary ?? '-'}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        PM2.5 {dataset.airNow?.pm2p5 ?? '-'} / O3 {dataset.airNow?.o3 ?? '-'}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/90 px-4 py-3 ring-1 ring-slate-200/80">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">更新时间</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {dataset.airNow?.pubTime ? formatDateTime(dataset.airNow.pubTime) : '-'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        小时样本 {dataset.hourly.length} 条
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <ChartCard
            title="AQI 小时趋势对比"
            description="以同一时间轴查看多座城市的 AQI 波动，适合答辩时解释空气质量变化差异。"
            option={buildCompareTrendOption(selectedDatasets)}
            icon={<LineChart className="size-5" />}
          />
          <ChartCard
            title="关键污染物指标对比"
            description="横向比较 AQI、PM2.5 与 O3，快速说明不同城市当前污染形态。"
            option={buildCompareBarOption(selectedDatasets)}
            icon={<BarChart3 className="size-5" />}
          />
          <ChartCard
            title="污染物结构雷达图"
            description="用雷达图突出污染物结构差异，增强页面的分析感和展示完整度。"
            option={buildCompareRadarOption(selectedDatasets)}
            icon={<Radar className="size-5" />}
          />
        </div>

        {loadingDatasets ? (
          <div className="pb-2 text-center text-sm text-slate-500">正在刷新城市对比数据…</div>
        ) : null}
      </div>
    </div>
  );
}
