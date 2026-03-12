import React from 'react';
import type { EChartsOption } from 'echarts';
import { AlertTriangle, Gauge, Sparkles, Waves } from 'lucide-react';
import type { NoticeAdminListData, ProviderOverviewData } from '@air-monitor/shared';

import { EChartsViewport } from '@/ui/admin/dashboard/components/dashboard-primitives';
import type { DashboardCitySpotlightItem } from '@/ui/admin/dashboard/hooks/use-dashboard-core-data';

type DashboardSpotlightProps = {
  locale: string;
  averageAqi: number | null;
  alertCityCount: number;
  cleanestCities: DashboardCitySpotlightItem[];
  riskiestCities: DashboardCitySpotlightItem[];
  noticeSample: NoticeAdminListData['list'];
  providerOverview: ProviderOverviewData | null;
};

function textByLocale(locale: string, zh: string, en: string): string {
  return locale.startsWith('zh') ? zh : en;
}

function SpotlightMetric(props: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="rounded-[22px] border border-slate-200/85 bg-white/88 px-5 py-4 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.34)]">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-2xl border border-slate-200/85 bg-slate-50 text-sky-700">
          {props.icon}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{props.title}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{props.value}</div>
          <div className="mt-1 text-xs text-slate-500">{props.hint}</div>
        </div>
      </div>
    </div>
  );
}

function RankingCard(props: {
  locale: string;
  title: string;
  rows: DashboardCitySpotlightItem[];
  tone: 'emerald' | 'rose';
  empty: string;
}): React.ReactNode {
  const accent =
    props.tone === 'emerald'
      ? 'text-emerald-700 border-emerald-200/80 bg-emerald-50'
      : 'text-rose-700 border-rose-200/80 bg-rose-50';

  return (
    <div className="rounded-[24px] border border-slate-200/85 bg-white/88 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.34)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">{props.title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {textByLocale(props.locale, '用于快速查看城市空气质量对比。', 'Quick city-level air quality comparison.')}
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accent}`}>Top 3</span>
      </div>

      <div className="mt-4 space-y-3">
        {props.rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            {props.empty}
          </div>
        ) : (
          props.rows.map((item, index) => (
            <div
              key={item.cityId}
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/85 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="grid size-6 place-items-center rounded-full bg-white text-xs text-slate-500 ring-1 ring-slate-200">
                    {index + 1}
                  </span>
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {item.primary
                    ? textByLocale(props.locale, `首要污染物 ${item.primary}`, `Primary pollutant ${item.primary}`)
                    : textByLocale(props.locale, '暂无首要污染物标签', 'No primary pollutant label')}
                  {' / '}
                  {textByLocale(props.locale, `预警 ${item.alertCount}`, `Alerts ${item.alertCount}`)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold text-slate-950">{item.aqi ?? '-'}</div>
                <div className="text-xs text-slate-500">AQI</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function buildNoticeStatusOption(
  list: NoticeAdminListData['list'],
  locale: string,
): EChartsOption {
  const labels = locale.startsWith('zh')
    ? {
        active: '生效中',
        pending: '待生效',
        expired: '已过期',
        revoked: '已作废',
        total: '公告总数',
        empty: '暂无公告状态数据',
      }
    : {
        active: 'Active',
        pending: 'Pending',
        expired: 'Expired',
        revoked: 'Revoked',
        total: 'Notices',
        empty: 'No notice status data',
      };

  const buckets = [
    { name: labels.active, value: list.filter((item) => item.status === 'active').length, color: '#10b981' },
    { name: labels.pending, value: list.filter((item) => item.status === 'pending').length, color: '#f59e0b' },
    { name: labels.expired, value: list.filter((item) => item.status === 'expired').length, color: '#64748b' },
    { name: labels.revoked, value: list.filter((item) => item.status === 'revoked').length, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const total = buckets.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return {
      xAxis: { show: false, min: 0, max: 1 },
      yAxis: { show: false, min: 0, max: 1 },
      series: [],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: labels.empty,
            fill: '#64748b',
            fontSize: 14,
          },
        },
      ],
    };
  }

  return {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      left: 'center',
      itemWidth: 9,
      itemHeight: 9,
      textStyle: { color: '#64748b', fontSize: 12 },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: String(total),
          fill: '#0f172a',
          fontSize: 26,
          fontWeight: 700,
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '56%',
        style: {
          text: labels.total,
          fill: '#64748b',
          fontSize: 12,
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['50%', '45%'],
        label: { show: false },
        data: buckets.map((item) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color, borderColor: '#fff', borderWidth: 2 },
        })),
      },
    ],
  };
}

function buildProviderOverviewOption(
  providerOverview: ProviderOverviewData | null,
  locale: string,
): EChartsOption {
  const providers = providerOverview?.providers ?? [];

  if (providers.length === 0) {
    return {
      xAxis: { show: false, min: 0, max: 1 },
      yAxis: { show: false, min: 0, max: 1 },
      series: [],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: textByLocale(locale, '暂无平台健康数据', 'No provider overview data'),
            fill: '#64748b',
            fontSize: 14,
          },
        },
      ],
    };
  }

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 28, right: 14, top: 18, bottom: 28, containLabel: true },
    xAxis: {
      type: 'category',
      data: providers.map((item) => item.displayName),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
    },
    series: [
      {
        name: textByLocale(locale, '请求量', 'Requests'),
        type: 'bar',
        barWidth: 18,
        data: providers.map((item) => ({
          value: item.requestCount ?? 0,
          itemStyle: {
            color: item.status === 'ok' ? '#2563eb' : '#f97316',
            borderRadius: [10, 10, 0, 0],
          },
        })),
      },
    ],
  };
}

function ChartPanel(props: {
  title: string;
  description: string;
  option: EChartsOption;
}): React.ReactNode {
  return (
    <div className="rounded-[24px] border border-slate-200/85 bg-white/88 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.34)]">
      <div>
        <div className="text-sm font-semibold text-slate-950">{props.title}</div>
        <div className="mt-1 text-xs text-slate-500">{props.description}</div>
      </div>
      <div className="mt-4">
        <EChartsViewport option={props.option} className="h-[240px] w-full" />
      </div>
    </div>
  );
}

export function DashboardSpotlight(props: DashboardSpotlightProps): React.ReactNode {
  const noticeStatusOption = React.useMemo(
    () => buildNoticeStatusOption(props.noticeSample, props.locale),
    [props.locale, props.noticeSample],
  );
  const providerOverviewOption = React.useMemo(
    () => buildProviderOverviewOption(props.providerOverview, props.locale),
    [props.locale, props.providerOverview],
  );

  return (
    <div className="shrink-0 space-y-4 pb-4 pt-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SpotlightMetric
          title={textByLocale(props.locale, '空气概览', 'Air Overview')}
          value={props.averageAqi !== null ? String(props.averageAqi) : '-'}
          hint={textByLocale(props.locale, '当前城市样本的平均 AQI', 'Average AQI across sampled cities')}
          icon={<Gauge className="size-5" />}
        />
        <SpotlightMetric
          title={textByLocale(props.locale, '预警城市', 'Alert Cities')}
          value={String(props.alertCityCount)}
          hint={textByLocale(props.locale, '当前存在活跃预警的城市数量', 'Cities with active alerts right now')}
          icon={<AlertTriangle className="size-5" />}
        />
        <SpotlightMetric
          title={textByLocale(props.locale, '排名速览', 'Rankings')}
          value={textByLocale(props.locale, '多维排行', 'Top Lists')}
          hint={textByLocale(props.locale, '直接查看城市空气质量差异', 'Compare cities at a glance')}
          icon={<Sparkles className="size-5" />}
        />
        <SpotlightMetric
          title={textByLocale(props.locale, '展示风格', 'View Mode')}
          value={textByLocale(props.locale, '实时 + 分析', 'Live + Insight')}
          hint={textByLocale(props.locale, '管理信息与分析结果同时呈现', 'Management and analytics together')}
          icon={<Waves className="size-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankingCard
          locale={props.locale}
          title={textByLocale(props.locale, '空气质量最佳城市', 'Best Air Quality Cities')}
          rows={props.cleanestCities}
          tone="emerald"
          empty={textByLocale(props.locale, '当前暂无可计算的最佳城市数据。', 'No best-city AQI data available.')}
        />
        <RankingCard
          locale={props.locale}
          title={textByLocale(props.locale, '风险最高城市', 'Highest Risk Cities')}
          rows={props.riskiestCities}
          tone="rose"
          empty={textByLocale(props.locale, '当前暂无可计算的高风险城市数据。', 'No high-risk city data available.')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title={textByLocale(props.locale, '公告状态分布', 'Notice Status')}
          description={textByLocale(
            props.locale,
            '用环图汇总公告当前所处状态。',
            'Summary of current notice lifecycle states.',
          )}
          option={noticeStatusOption}
        />
        <ChartPanel
          title={textByLocale(props.locale, '平台请求概览', 'Provider Requests')}
          description={textByLocale(
            props.locale,
            '展示各数据平台请求量与健康状态差异。',
            'Compare request volume and health across providers.',
          )}
          option={providerOverviewOption}
        />
      </div>
    </div>
  );
}
