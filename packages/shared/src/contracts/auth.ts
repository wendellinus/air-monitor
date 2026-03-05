import type { UserRole } from '../user-role';

export type UserLocale = 'zh-CN' | 'en-US';

export type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
};

export type RegisterResponseData = {
  id: number;
  username: string;
  email?: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginUser = {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
};

export type LoginResponseData = {
  token: string;
  refreshToken: string;
  user: LoginUser;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponseData = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponseData = {
  id: number;
  username: string;
  role: UserRole;
  locale: UserLocale;
};

export type MeProfileData = {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  locale: UserLocale;
};

export type UpdateMeProfileRequest = {
  username: string;
  email?: string;
};

export type UpdateLocaleRequest = {
  locale: UserLocale;
};

export type OkResponseData = {
  ok: true;
};
