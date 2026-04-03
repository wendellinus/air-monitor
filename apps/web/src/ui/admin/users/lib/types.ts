import type { UserListData, UserRole } from '@air-monitor/shared';

export type UserItem = UserListData['list'][number];
export type UserPageRole = UserRole;
export type UserFilterRole = 'all' | UserPageRole;
export type UserFilterStatus = 'all' | 'active' | 'disabled';
export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type AdminCreateUserRequest = {
  username: string;
  encryptedPassword?: string;
  passwordKeyId?: string;
  role?: UserRole;
  isActive?: boolean;
  deniedPermissionKeys?: string[];
};

export type CreateUserDialogValues = {
  username: string;
  password: string;
  role: UserRole;
  isActive: boolean;
};
