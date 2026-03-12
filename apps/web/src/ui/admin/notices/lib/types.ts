import type { NoticeAdminListData, NoticeItem } from '@air-monitor/shared';

export type AdminNoticeItem = NoticeItem;
export type AdminNoticeListData = NoticeAdminListData;
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
export type NoticeFilterStatus = 'all' | 'active' | 'pending' | 'revoked' | 'expired';

export type CreateNoticeForm = {
  title: string;
  content: string;
  level: 'info' | 'urgent';
  startTime: string;
  endTime: string;
};

export function getDefaultCreateNoticeForm(): CreateNoticeForm {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    title: '',
    content: '',
    level: 'info',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}
