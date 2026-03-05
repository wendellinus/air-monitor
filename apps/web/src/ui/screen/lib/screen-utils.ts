import { toast } from 'sonner';

const toastDedupe = new Map<string, number>();

export function toastErrorDeduped(key: string, message: string, ttlMs = 2500): void {
  const now = Date.now();
  const last = toastDedupe.get(key) ?? 0;
  if (now - last < ttlMs) return;
  toastDedupe.set(key, now);
  toast.error(message);
}

export const REFRESH_TOP_CITIES_MS = 30 * 60_000;
export const REFRESH_NOTICES_MS = 5 * 60_000;
export const REFRESH_AIR_MS = 60_000;
export const REFRESH_ALERTS_MS = 3 * 60_000;

export function formatDateTime(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function formatHourLabel(value: string | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function aqiTone(aqi: number): { label: string; className: string } {
  if (aqi <= 50) return { label: '优', className: 'text-emerald-200' };
  if (aqi <= 100) return { label: '良', className: 'text-lime-200' };
  if (aqi <= 150) return { label: '轻度', className: 'text-amber-200' };
  if (aqi <= 200) return { label: '中度', className: 'text-orange-200' };
  if (aqi <= 300) return { label: '重度', className: 'text-rose-200' };
  return { label: '严重', className: 'text-fuchsia-200' };
}

export function alertSeverityLabel(value: string | undefined): string {
  const s = (value ?? '').trim().toLowerCase();
  if (!s) return '-';
  if (s === 'minor') return '轻微';
  if (s === 'moderate') return '中等';
  if (s === 'severe') return '严重';
  if (s === 'extreme') return '特别严重';
  return value ?? '-';
}

export function humanizeError(input: unknown): string {
  const unknownMsg = '操作失败，请稍后重试。';

  const anyErr = input as
    | {
        message?: unknown;
        code?: unknown;
        response?: { data?: { msg?: unknown } };
      }
    | null
    | undefined;

  const msgFromApi = anyErr?.response?.data?.msg;
  if (typeof msgFromApi === 'string' && msgFromApi.trim()) return msgFromApi.trim();

  const raw = typeof anyErr?.message === 'string' ? anyErr.message : String(input ?? '');
  if (!raw) return unknownMsg;
  const lower = raw.toLowerCase();

  const geoCodeMatch = lower.match(/qweather\s+geo\s+error:\s*code=(\d+)/i);
  if (geoCodeMatch) {
    const code = geoCodeMatch[1];
    if (code === '204' || code === '404') {
      return '该位置无法识别到有效城市（可能在海面/无人区），请选陆地位置。';
    }
    if (code === '400') {
      return '所选位置无效，请重新选择。';
    }
    if (code === '401' || code === '403') {
      return '定位服务暂不可用，请稍后再试。';
    }
    return '定位服务暂不可用，请稍后再试。';
  }

  if (/[\u4e00-\u9fff]/.test(raw) && raw.length <= 60) return raw.trim();

  if (lower.includes('city not found')) return '未找到该位置对应的城市，请换个位置试试。';
  if (lower.includes('invalid') && (lower.includes('location') || lower.includes('coordinate'))) {
    return '所选位置无效（可能在海面或无有效地址），请重新选择。';
  }
  if (lower.includes('not found') || lower.includes('404')) return '未找到相关数据，请换个位置试试。';
  if (lower.includes('network error') || lower.includes('failed to fetch')) {
    return '网络异常，请检查网络后重试。';
  }
  if (lower.includes('timeout') || lower.includes('etimedout') || lower.includes('econnaborted')) {
    return '请求超时，请稍后重试。';
  }
  if (lower.includes('econnrefused') || lower.includes('connect') || lower.includes('socket')) {
    return '服务暂不可用，请稍后重试。';
  }

  return unknownMsg;
}
