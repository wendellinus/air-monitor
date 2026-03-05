function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

type NumericCandidate = {
  path: string;
  value: number;
};

function collectNumericCandidates(input: unknown, path = ''): NumericCandidate[] {
  if (!input || typeof input !== 'object') return [];
  const entries: NumericCandidate[] = [];

  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      entries.push(...collectNumericCandidates(item, `${path}[${index}]`));
    });
    return entries;
  }

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const nextPath = path ? `${path}.${key}` : key;
    const n = toFiniteNumber(value);
    if (n !== null) {
      entries.push({ path: nextPath.toLowerCase(), value: n });
    }
    if (value && typeof value === 'object') {
      entries.push(...collectNumericCandidates(value, nextPath));
    }
  }

  return entries;
}

function pickByKeywordGroups(candidates: NumericCandidate[], groups: string[][]): number | null {
  for (const words of groups) {
    const hit = candidates.find((item) => words.every((word) => item.path.includes(word)));
    if (hit) return hit.value;
  }
  return null;
}

export function normalizeProviderNumbers(input: unknown): {
  balance: number | null;
  requestCount: number | null;
  quotaLimit: number | null;
  quotaUsed: number | null;
  usageRate: number | null;
} {
  const candidates = collectNumericCandidates(input);

  const balance = pickByKeywordGroups(candidates, [
    ['balance'],
    ['credit'],
    ['remaining', 'amount'],
    ['remain', 'balance'],
  ]);

  const requestCount = pickByKeywordGroups(candidates, [
    ['request', 'count'],
    ['requests'],
    ['call', 'count'],
    ['api', 'count'],
  ]);

  const quotaLimit = pickByKeywordGroups(candidates, [
    ['quota', 'limit'],
    ['total', 'limit'],
    ['request', 'limit'],
    ['allowance'],
  ]);

  const quotaUsed = pickByKeywordGroups(candidates, [
    ['quota', 'used'],
    ['used', 'count'],
    ['request', 'used'],
    ['consumed'],
    ['usage'],
  ]) ?? requestCount;

  let usageRate = pickByKeywordGroups(candidates, [
    ['usage', 'rate'],
    ['utilization'],
    ['percent'],
  ]);

  if (usageRate !== null && usageRate > 1 && usageRate <= 100) {
    usageRate = usageRate / 100;
  }
  if (usageRate === null && quotaLimit !== null && quotaLimit > 0 && quotaUsed !== null) {
    usageRate = quotaUsed / quotaLimit;
  }

  return {
    balance,
    requestCount,
    quotaLimit,
    quotaUsed,
    usageRate,
  };
}
