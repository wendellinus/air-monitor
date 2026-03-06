import type { AdminNoticeItem } from './types';

export type NoticeViewStatus = 'active' | 'pending' | 'revoked' | 'expired';

function parseIsoTime(value: string): number | null {
  const ts = Date.parse(value);
  return Number.isNaN(ts) ? null : ts;
}

export function deriveNoticeViewStatus(
  rawStatus: string,
  startTime: string,
  endTime: string,
  now: number = Date.now(),
): NoticeViewStatus {
  if (rawStatus === 'active' || rawStatus === 'pending' || rawStatus === 'revoked' || rawStatus === 'expired') {
    return rawStatus;
  }

  const start = parseIsoTime(startTime);
  const end = parseIsoTime(endTime);
  const isExpired = typeof end === 'number' && end < now;
  const isPending = typeof start === 'number' && start > now;

  if (isExpired) return 'expired';
  if (rawStatus === 'published') return isPending ? 'pending' : 'active';
  if (rawStatus === 'draft') return 'pending';
  return isPending ? 'pending' : 'active';
}

export function normalizeAdminNoticeItem(item: AdminNoticeItem, now: number = Date.now()): AdminNoticeItem {
  return {
    ...item,
    status: deriveNoticeViewStatus(item.status, item.startTime, item.endTime, now),
  };
}
