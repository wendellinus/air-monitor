import type { PageResult } from '../pagination';
import type { UserRole } from '../user-role';
import type { CityItem } from './city';
import type { PermissionTreeNode } from './permission';

export type UserListItem = {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type UserListData = PageResult<UserListItem>;

export type AdminSetUserStatusRequest = {
  isActive: boolean;
};

export type AdminResetPasswordRequest = {
  newPassword?: string;
  encryptedNewPassword?: string;
  passwordKeyId?: string;
};

export type AdminSetUserRoleRequest = {
  role: UserRole;
};

export type AdminUserDetailData = {
  id: number;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  rolePermissionKeys: string[];
  deniedPermissionKeys: string[];
  effectivePermissionKeys: string[];
  permissionTree: PermissionTreeNode[];
};

export type AdminUpdateUserDetailRequest = {
  username: string;
  isActive: boolean;
  deniedPermissionKeys: string[];
};

export type UserFavoriteCityCreateRequest = CityItem;

export type AdminFavoriteCityItem = {
  userId: number;
  username: string;
  cityId: string;
  cityName: string;
  adm1: string;
  adm2: string;
  country: string;
  createdAt: string;
};

export type AdminFavoriteCityListData = PageResult<AdminFavoriteCityItem>;
