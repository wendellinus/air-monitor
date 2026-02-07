import type { WeatherAlertItem } from '@air-monitor/shared';

import coldUrl from '@/assets/alert-icons/cold.svg?url';
import defaultUrl from '@/assets/alert-icons/default.svg?url';
import fogUrl from '@/assets/alert-icons/fog.svg?url';
import heatUrl from '@/assets/alert-icons/heat.svg?url';
import rainUrl from '@/assets/alert-icons/rain.svg?url';
import thunderUrl from '@/assets/alert-icons/thunder.svg?url';
import typhoonUrl from '@/assets/alert-icons/typhoon.svg?url';

const maskUrlByKind = {
  typhoon: typhoonUrl,
  rain: rainUrl,
  thunder: thunderUrl,
  heat: heatUrl,
  cold: coldUrl,
  fog: fogUrl,
  default: defaultUrl,
} as const;

export type AlertKind = keyof typeof maskUrlByKind;

const kindLabelByKind: Record<AlertKind, string> = {
  typhoon: '台风',
  rain: '暴雨',
  thunder: '雷电',
  heat: '高温',
  cold: '寒潮',
  fog: '大雾',
  default: '预警',
};

function severityScore(severity: string | undefined): number {
  const s = (severity ?? '').trim().toLowerCase();
  if (s === 'extreme') return 4;
  if (s === 'severe') return 3;
  if (s === 'moderate') return 2;
  if (s === 'minor') return 1;
  return 0;
}

export function pickPrimaryAlert(alerts: WeatherAlertItem[]): WeatherAlertItem | null {
  if (!Array.isArray(alerts) || alerts.length === 0) return null;
  let best = alerts[0]!;
  let bestScore = severityScore(best.severity);
  for (let i = 1; i < alerts.length; i++) {
    const cur = alerts[i]!;
    const curScore = severityScore(cur.severity);
    if (curScore > bestScore) {
      best = cur;
      bestScore = curScore;
    }
  }
  return best;
}

export function getAlertKind(alert: WeatherAlertItem): AlertKind {
  const raw = `${alert.eventType?.name ?? ''} ${alert.headline ?? ''} ${alert.description ?? ''}`;
  const text = raw.toLowerCase();

  const includesAny = (list: string[]): boolean => list.some((k) => text.includes(k));

  if (
    includesAny([
      'typhoon',
      'hurricane',
      'cyclone',
      '台风',
      '飓风',
      '旋风',
      '热带风暴',
      '热带低压',
    ])
  ) {
    return 'typhoon';
  }
  if (includesAny(['thunder', 'lightning', '雷暴', '雷电', '强对流'])) return 'thunder';
  if (includesAny(['rain', 'downpour', 'storm', '暴雨', '大雨', '强降雨', '降雨'])) return 'rain';
  if (includesAny(['heat', 'hot', '高温', '热浪', '酷热'])) return 'heat';
  if (includesAny(['cold', 'freeze', '寒潮', '低温', '冰冻', '霜冻'])) return 'cold';
  if (includesAny(['fog', 'haze', 'smog', 'mist', '大雾', '雾', '雾霾', '霾'])) return 'fog';
  return 'default';
}

export function getAlertMaskUrl(kind: AlertKind): string {
  return maskUrlByKind[kind] ?? defaultUrl;
}

export function getAlertKindLabel(kind: AlertKind): string {
  return kindLabelByKind[kind] ?? kindLabelByKind.default;
}

export function getAlertAccentColor(alert: WeatherAlertItem): string | null {
  const c = (alert.color?.code ?? '').trim();
  if (!c) return null;

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(c)) return c;
  if (/^(rgb|hsl)a?\(/i.test(c)) return c;
  return null;
}
