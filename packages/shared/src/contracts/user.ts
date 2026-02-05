import type { PageResult } from '../pagination';
import type { UserRole } from '../user-role';

export type UserListItem = {
  id: number;
  username: string;
  email?: string;
};

export type UserListData = PageResult<UserListItem>;

export type AdminSetUserStatusRequest = {
  isActive: boolean;
};

export type AdminResetPasswordRequest = {
  newPassword: string;
};

export type AdminSetUserRoleRequest = {
  role: UserRole;
};

