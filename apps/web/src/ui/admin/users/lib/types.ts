import type { UserListData, UserRole } from '@air-monitor/shared';

export type UserItem = UserListData['list'][number];
export type UserPageRole = UserRole;
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;
