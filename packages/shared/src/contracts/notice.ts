import type { PageResult } from '../pagination';

export type NoticeItem = {
  id: number;
  title: string;
  content?: string;
  startTime: string;
  endTime: string;
  status: string;
  level: string;
  alertId?: string;
  eventType?: string;
  severity?: string;
  colorCode?: string;
  source: string;
};

export type NoticeAdminListData = PageResult<NoticeItem>;

