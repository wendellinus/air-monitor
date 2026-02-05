import type { QweatherAirRealtime } from './qweather.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? (value as Record<string, unknown>) : null;
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const s = toStringOrUndefined(item);
      if (s) return s;
    }
    return undefined;
  }
  if (isRecord(value)) {
    const v = value as Record<string, unknown>;
    return (
      toStringOrUndefined(v.name) ??
      toStringOrUndefined(v.code) ??
      toStringOrUndefined(v.text) ??
      toStringOrUndefined(v.value)
    );
  }
  return undefined;
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function getNestedNumber(obj: Record<string, unknown>, key: string): number | undefined {
  const direct = toNumberOrUndefined(obj[key]);
  if (typeof direct === 'number') return direct;
  const nested = asRecord(obj[key]);
  if (nested) {
    const v = toNumberOrUndefined(nested.value);
    if (typeof v === 'number') return v;
  }
  return undefined;
}

function normalizePollutantCode(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, '')
    .replace(/[.\-_]/g, '');
}

function pickIndexForAqi(indexes: Array<Record<string, unknown>>): Record<string, unknown> | null {
  if (indexes.length === 0) return null;
  const preferred = indexes.find((x) => {
    const code = toStringOrUndefined(x.code) ?? '';
    const name = toStringOrUndefined(x.name) ?? '';
    const lower = `${code} ${name}`.toLowerCase();
    return lower.includes('aqi');
  });
  return preferred ?? indexes[0] ?? null;
}

export function normalizeQweatherAirRealtime(data: unknown): QweatherAirRealtime {
  const root = asRecord(data);
  if (!root) throw new Error('QWeather Air invalid response.');

  const code = toStringOrUndefined(root.code);
  if (typeof code === 'string' && code !== '200') {
    throw new Error(`QWeather Air error: code=${code}`);
  }

  const hasV1Hints = Array.isArray(root.indexes) || Array.isArray(root.pollutants) || isRecord(root.metadata);
  const hasV7Now = isRecord(root.now);

  // v7 style: { code: "200", now: {...} }
  if (hasV7Now && !hasV1Hints) {
    const now = asRecord(root.now) ?? root;
    const result: QweatherAirRealtime = {
      pubTime: String(now.pubTime ?? now.updateTime ?? root.updateTime ?? new Date().toISOString()),
      aqi: Number(now.aqi ?? 0),
      level: String(now.level ?? ''),
      category: String(now.category ?? ''),
      primary: now.primary ? String(now.primary) : undefined,
      pm10: Number(now.pm10 ?? 0),
      pm2p5: Number(now.pm2p5 ?? 0),
      no2: Number(now.no2 ?? 0),
      so2: Number(now.so2 ?? 0),
      co: Number(now.co ?? 0),
      o3: Number(now.o3 ?? 0),
    };

    const looksEmpty =
      result.aqi === 0 &&
      result.pm10 === 0 &&
      result.pm2p5 === 0 &&
      result.no2 === 0 &&
      result.so2 === 0 &&
      result.co === 0 &&
      result.o3 === 0 &&
      !result.category &&
      !result.level;
    if (looksEmpty) throw new Error('QWeather Air returned empty data.');
    return result;
  }

  // v1/JWT style: { indexes: [...], pollutants: [...] }
  const indexesRaw = Array.isArray(root.indexes) ? root.indexes : [];
  const indexes: Array<Record<string, unknown>> = indexesRaw.map(asRecord).filter(Boolean) as Array<Record<string, unknown>>;
  const pickedIndex = pickIndexForAqi(indexes);

  const aqi =
    (pickedIndex ? getNestedNumber(pickedIndex, 'aqi') : undefined) ??
    (pickedIndex ? getNestedNumber(pickedIndex, 'value') : undefined) ??
    (pickedIndex ? toNumberOrUndefined(pickedIndex.aqi) : undefined) ??
    (pickedIndex ? toNumberOrUndefined(pickedIndex.value) : undefined) ??
    0;
  const level =
    (pickedIndex ? toStringOrUndefined(pickedIndex.level) : undefined) ??
    (pickedIndex ? toStringOrUndefined(pickedIndex.aqiLevel) : undefined) ??
    '';
  const category =
    (pickedIndex ? toStringOrUndefined(pickedIndex.category) : undefined) ??
    (pickedIndex ? toStringOrUndefined(pickedIndex.aqiCategory) : undefined) ??
    '';
  const primary =
    (pickedIndex ? toStringOrUndefined(pickedIndex.primary) : undefined) ??
    (pickedIndex ? toStringOrUndefined(pickedIndex.primaryPollutant) : undefined) ??
    (pickedIndex ? toStringOrUndefined(pickedIndex.primary_pollutant) : undefined);

  const pollutantsRaw = Array.isArray(root.pollutants) ? root.pollutants : [];
  const pollutants: Array<Record<string, unknown>> = pollutantsRaw
    .map(asRecord)
    .filter(Boolean) as Array<Record<string, unknown>>;

  const byCode = new Map<string, number>();
  for (const p of pollutants) {
    const codeStr = toStringOrUndefined(p.code) ?? toStringOrUndefined(p.name) ?? '';
    const codeNorm = normalizePollutantCode(codeStr);
    if (!codeNorm) continue;

    const value =
      getNestedNumber(p, 'concentration') ??
      getNestedNumber(p, 'value') ??
      toNumberOrUndefined(p.value) ??
      toNumberOrUndefined(p.concentration);
    if (typeof value !== 'number') continue;

    byCode.set(codeNorm, value);
  }

  const pm2p5 = byCode.get('pm25') ?? byCode.get('pm2p5') ?? 0;
  const pm10 = byCode.get('pm10') ?? 0;
  const no2 = byCode.get('no2') ?? 0;
  const so2 = byCode.get('so2') ?? 0;
  const co = byCode.get('co') ?? 0;
  const o3 = byCode.get('o3') ?? 0;

  const pubTime =
    toStringOrUndefined(root.pubTime) ??
    toStringOrUndefined(root.updateTime) ??
    (pickedIndex ? toStringOrUndefined(pickedIndex.pubTime) : undefined) ??
    (pickedIndex ? toStringOrUndefined(pickedIndex.updateTime) : undefined) ??
    new Date().toISOString();

  const result: QweatherAirRealtime = {
    pubTime,
    aqi,
    level,
    category,
    primary,
    pm10,
    pm2p5,
    no2,
    so2,
    co,
    o3,
  };

  const looksEmpty =
    result.aqi === 0 &&
    result.pm10 === 0 &&
    result.pm2p5 === 0 &&
    result.no2 === 0 &&
    result.so2 === 0 &&
    result.co === 0 &&
    result.o3 === 0 &&
    !result.category &&
    !result.level;

  if (looksEmpty) {
    const hint =
      Array.isArray(root.pollutants) && root.pollutants.length > 0
        ? ' (pollutants present but unrecognized format)'
        : '';
    throw new Error(`QWeather Air returned empty data.${hint}`);
  }

  return result;
}

export function normalizeQweatherAirTimelineItem(item: unknown): Record<string, unknown> | null {
  const root = asRecord(item);
  if (!root) return null;

  const time =
    toStringOrUndefined(root.fxTime) ??
    toStringOrUndefined(root.pubTime) ??
    toStringOrUndefined(root.time) ??
    toStringOrUndefined(root.updateTime);

  const hasIndexes = Array.isArray(root.indexes);
  const hasPollutants = Array.isArray(root.pollutants);

  if (hasIndexes || hasPollutants) {
    try {
      const normalized = normalizeQweatherAirRealtime({ ...root, pubTime: time ?? root.pubTime });
      return {
        fxTime: time ?? normalized.pubTime,
        ...normalized,
      };
    } catch {
      return null;
    }
  }

  const aqi = toNumberOrUndefined(root.aqi);
  const level = toStringOrUndefined(root.level);
  const category = toStringOrUndefined(root.category);
  const primary = toStringOrUndefined(root.primary);

  const pm10 = toNumberOrUndefined(root.pm10);
  const pm2p5 = toNumberOrUndefined(root.pm2p5);
  const no2 = toNumberOrUndefined(root.no2);
  const so2 = toNumberOrUndefined(root.so2);
  const co = toNumberOrUndefined(root.co);
  const o3 = toNumberOrUndefined(root.o3);

  const looksEmpty =
    (aqi ?? 0) === 0 &&
    (pm10 ?? 0) === 0 &&
    (pm2p5 ?? 0) === 0 &&
    (no2 ?? 0) === 0 &&
    (so2 ?? 0) === 0 &&
    (co ?? 0) === 0 &&
    (o3 ?? 0) === 0 &&
    !category &&
    !level;

  if (looksEmpty) return null;

  return {
    fxTime: time,
    pubTime: time ?? new Date().toISOString(),
    aqi,
    level,
    category,
    primary,
    pm10,
    pm2p5,
    no2,
    so2,
    co,
    o3,
  };
}
