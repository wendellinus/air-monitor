import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type {
  AdminFavoriteCityItem,
  AdminFavoriteCityListData,
  AdminUpdateUserDetailRequest,
  AdminUserDetailData,
  CityItem,
  DashboardLayoutData,
  DashboardLayoutItem,
  DashboardWidgetId,
  MeProfileData,
  MeResponseData,
  UpdateMeProfileRequest,
  UserListData,
  UserListItem,
  UserLocale,
} from '@air-monitor/shared';
import { DashboardWidgetIds } from '@air-monitor/shared';

import { AppError } from '../../shared/app-error';
import type { UserRole } from '../../shared/authz/user-role';
import { ErrorCodes } from '../../shared/error-codes';
import { CityService } from '../city/city.service';
import { PermissionService } from '../permission/permission.service';

import { UserRepository } from './user.repository';

const DASHBOARD_LAYOUT_VERSION = 2;
const DASHBOARD_COL_SPAN_MIN = 1;
const DASHBOARD_COL_SPAN_MAX = 3;
const DASHBOARD_ROW_SPAN_MIN = 1;
const DASHBOARD_ROW_SPAN_MAX = 3;

const DASHBOARD_DEFAULT_SIZE: Record<DashboardWidgetId, { colSpan: number; rowSpan: number }> = {
  'metric-users': { colSpan: 1, rowSpan: 1 },
  'metric-notices': { colSpan: 1, rowSpan: 1 },
  'metric-role': { colSpan: 1, rowSpan: 1 },
  'panel-action-required': { colSpan: 1, rowSpan: 1 },
  'panel-api-health': { colSpan: 1, rowSpan: 1 },
  'panel-data-quality': { colSpan: 1, rowSpan: 1 },
  'chart-status': { colSpan: 2, rowSpan: 2 },
  'chart-trend': { colSpan: 2, rowSpan: 2 },
  'panel-recent-notices': { colSpan: 2, rowSpan: 2 },
};

type UserQueryFilters = {
  role?: UserRole;
  isActive?: boolean;
  createdFrom?: string;
  createdTo?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildDefaultDashboardLayout(): DashboardLayoutItem[] {
  return DashboardWidgetIds.map((id, index) => ({
    id,
    order: index,
    pinned: false,
    colSpan: DASHBOARD_DEFAULT_SIZE[id].colSpan,
    rowSpan: DASHBOARD_DEFAULT_SIZE[id].rowSpan,
  }));
}

function isDashboardWidgetId(input: string): input is DashboardWidgetId {
  return (DashboardWidgetIds as readonly string[]).includes(input);
}

function normalizeDashboardLayout(input: DashboardLayoutItem[]): DashboardLayoutItem[] {
  const seen = new Set<string>();
  const normalized: DashboardLayoutItem[] = [];
  const sorted = [...input].sort((a, b) => a.order - b.order);

  for (const item of sorted) {
    const id = String(item.id);
    if (!isDashboardWidgetId(id) || seen.has(id)) continue;
    const defaults = DASHBOARD_DEFAULT_SIZE[id];
    seen.add(id);
    normalized.push({
      id,
      order: normalized.length,
      pinned: Boolean(item.pinned),
      colSpan: clamp(
        Number.isFinite(item.colSpan) ? Math.trunc(item.colSpan) : defaults.colSpan,
        DASHBOARD_COL_SPAN_MIN,
        DASHBOARD_COL_SPAN_MAX,
      ),
      rowSpan: clamp(
        Number.isFinite(item.rowSpan) ? Math.trunc(item.rowSpan) : defaults.rowSpan,
        DASHBOARD_ROW_SPAN_MIN,
        DASHBOARD_ROW_SPAN_MAX,
      ),
    });
  }

  for (const id of DashboardWidgetIds) {
    if (seen.has(id)) continue;
    const defaults = DASHBOARD_DEFAULT_SIZE[id];
    normalized.push({
      id,
      order: normalized.length,
      pinned: false,
      colSpan: defaults.colSpan,
      rowSpan: defaults.rowSpan,
    });
  }

  return normalized;
}

function areStringSetsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const leftSet = new Set(left);
  if (leftSet.size !== right.length) return false;
  return right.every((item) => leftSet.has(item));
}

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly repo: UserRepository,
    @Inject(CityService) private readonly cityService: CityService,
    @Inject(PermissionService) private readonly permissionService: PermissionService,
  ) {}

  async getMe(userId: number): Promise<MeResponseData> {
    const found = await this.repo.findProfileById(userId);
    if (!found) {
      throw new AppError(ErrorCodes.Unauthorized, 'Account not found or deleted.');
    }
    return {
      id: found.id,
      username: found.username,
      role: found.role,
      locale: found.locale as UserLocale,
    };
  }

  async getMyProfile(userId: number): Promise<MeProfileData> {
    const found = await this.repo.findSelfProfileById(userId);
    if (!found) {
      throw new AppError(ErrorCodes.Unauthorized, 'Account not found or deleted.');
    }
    return {
      id: found.id,
      username: found.username,
      email: found.email ?? undefined,
      role: found.role,
      locale: found.locale as UserLocale,
    };
  }

  async updateMyProfile(userId: number, payload: UpdateMeProfileRequest): Promise<MeProfileData> {
    const found = await this.repo.findSelfProfileById(userId);
    if (!found) {
      throw new AppError(ErrorCodes.Unauthorized, 'Account not found or deleted.');
    }

    if (payload.username !== found.username) {
      const existsUser = await this.repo.findByUsername(payload.username);
      if (existsUser && existsUser.id !== userId) {
        throw new AppError(ErrorCodes.ParamError, 'Username already exists.');
      }
    }

    const updated = await this.repo.updateSelfProfile(userId, {
      username: payload.username,
      email: payload.email ?? null,
    });
    return {
      id: updated.id,
      username: updated.username,
      email: updated.email ?? undefined,
      role: updated.role,
      locale: updated.locale as UserLocale,
    };
  }

  async getUserList(page: number, pageSize: number, filters?: UserQueryFilters): Promise<UserListData> {
    const { list, total } = await this.repo.list(page, pageSize, this.normalizeUserFilters(filters));
    return {
      list: list.map<UserListItem>((u) => ({
        id: u.id,
        username: u.username,
        email: u.email ?? undefined,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async searchUsers(
    keyword: string | undefined,
    page: number,
    pageSize: number,
    filters?: UserQueryFilters,
  ): Promise<UserListData> {
    const { list, total } = await this.repo.search(
      keyword,
      page,
      pageSize,
      this.normalizeUserFilters(filters),
    );
    return {
      list: list.map<UserListItem>((u) => ({
        id: u.id,
        username: u.username,
        email: u.email ?? undefined,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async setUserActive(id: number, isActive: boolean): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new AppError(ErrorCodes.ParamError, 'User not found.');

    const now = new Date();
    await this.repo.updateStatus(id, isActive, now);
    await this.repo.revokeAllRefreshTokens(id, now);
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new AppError(ErrorCodes.ParamError, 'User not found.');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    await this.repo.updatePassword(id, passwordHash, now);
    await this.repo.revokeAllRefreshTokens(id, now);
  }

  async setUserRole(id: number, role: UserRole): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new AppError(ErrorCodes.ParamError, 'User not found.');

    const now = new Date();
    await this.repo.updateRole(id, role, now);
    await this.repo.revokeAllRefreshTokens(id, now);
  }

  async getAdminUserDetail(id: number): Promise<AdminUserDetailData> {
    const found = await this.repo.findAdminDetailById(id);
    if (!found) {
      throw new AppError(ErrorCodes.ParamError, 'User not found.');
    }

    const permissionDetail = await this.permissionService.getUserPermissionDetail(found.id, found.role);
    return {
      id: found.id,
      username: found.username,
      role: found.role,
      isActive: found.isActive,
      createdAt: found.createdAt.toISOString(),
      rolePermissionKeys: permissionDetail.rolePermissionKeys,
      deniedPermissionKeys: permissionDetail.deniedPermissionKeys,
      effectivePermissionKeys: permissionDetail.effectivePermissionKeys,
      permissionTree: permissionDetail.permissionTree,
    };
  }

  async updateAdminUserDetail(
    actorUserId: number,
    actorRole: UserRole,
    id: number,
    payload: AdminUpdateUserDetailRequest,
  ): Promise<AdminUserDetailData> {
    const found = await this.repo.findAdminDetailById(id);
    if (!found) {
      throw new AppError(ErrorCodes.ParamError, 'User not found.');
    }

    const currentPermissionDetail = await this.permissionService.getUserPermissionDetail(found.id, found.role);
    const actorPermissionKeys = await this.permissionService.getMyPermissionKeys(actorUserId, actorRole);
    const actorPermissionSet = new Set(actorPermissionKeys);

    const usernameChanged = payload.username !== found.username;
    const statusChanged = payload.isActive !== found.isActive;
    const nextDeniedPermissionKeys = Array.from(new Set(payload.deniedPermissionKeys));
    const deniedChanged = !areStringSetsEqual(
      nextDeniedPermissionKeys,
      currentPermissionDetail.deniedPermissionKeys,
    );

    if ((usernameChanged || statusChanged) && !actorPermissionSet.has('users.profile.update')) {
      throw new AppError(ErrorCodes.Unauthorized, 'You do not have permission to update user profile fields.');
    }

    if (deniedChanged && !actorPermissionSet.has('users.permission.update')) {
      throw new AppError(ErrorCodes.Unauthorized, 'You do not have permission to update user permissions.');
    }

    if (usernameChanged) {
      const existsUser = await this.repo.findByUsername(payload.username);
      if (existsUser && existsUser.id !== id) {
        throw new AppError(ErrorCodes.ParamError, 'Username already exists.');
      }
    }

    if (usernameChanged || statusChanged) {
      const now = statusChanged ? new Date() : undefined;
      await this.repo.updateAdminDetail(id, {
        username: payload.username,
        isActive: payload.isActive,
        tokenInvalidBefore: now,
        incrementTokenVersion: statusChanged,
      });

      if (statusChanged && now) {
        await this.repo.revokeAllRefreshTokens(id, now);
      }
    }

    if (deniedChanged) {
      await this.permissionService.replaceUserDeniedPermissions(id, found.role, nextDeniedPermissionKeys);
    }

    return this.getAdminUserDetail(id);
  }

  async softDeleteUser(id: number): Promise<void> {
    const found = await this.repo.findAdminDetailById(id);
    if (!found) {
      throw new AppError(ErrorCodes.ParamError, 'User not found.');
    }

    const now = new Date();
    const archivedUsername = `deleted_${found.id}_${now.getTime()}`.slice(0, 20);
    await this.repo.softDeleteUser(id, archivedUsername, now);
    await this.repo.revokeAllRefreshTokens(id, now);
  }

  async getFavoriteCities(userId: number): Promise<CityItem[]> {
    const list = await this.repo.listFavoriteCities(userId);
    return list.map((item) => ({
      cityId: item.cityId,
      name: item.name,
      lat: item.lat,
      lon: item.lon,
      adm2: item.adm2,
      adm1: item.adm1,
      country: item.country,
    }));
  }

  async addFavoriteCity(userId: number, city: CityItem): Promise<void> {
    await this.cityService.upsertCity({
      cityId: city.cityId,
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      adm2: city.adm2,
      adm1: city.adm1,
      country: city.country,
    });
    await this.repo.addFavoriteCity(userId, city.cityId);
  }

  async removeFavoriteCity(userId: number, cityId: string): Promise<void> {
    await this.repo.removeFavoriteCity(userId, cityId);
  }

  async getAdminFavoriteCities(
    page: number,
    pageSize: number,
    keyword: string | undefined,
  ): Promise<AdminFavoriteCityListData> {
    const { list, total } = await this.repo.listFavoriteCitiesForAdmin(page, pageSize, keyword);
    return {
      list: list.map<AdminFavoriteCityItem>((item) => ({
        userId: item.userId,
        username: item.username,
        cityId: item.cityId,
        cityName: item.cityName,
        adm1: item.adm1,
        adm2: item.adm2,
        country: item.country,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async removeFavoriteCityAsAdmin(userId: number, cityId: string): Promise<void> {
    await this.repo.removeFavoriteCity(userId, cityId);
  }

  async updateLocale(userId: number, locale: UserLocale): Promise<MeResponseData> {
    const found = await this.repo.findProfileById(userId);
    if (!found) {
      throw new AppError(ErrorCodes.Unauthorized, 'Account not found or deleted.');
    }
    await this.repo.updateLocale(userId, locale);
    return {
      id: found.id,
      username: found.username,
      role: found.role,
      locale,
    };
  }

  async getDashboardLayout(userId: number): Promise<DashboardLayoutData> {
    const foundUser = await this.repo.findProfileById(userId);
    if (!foundUser) {
      throw new AppError(ErrorCodes.Unauthorized, 'Account not found or deleted.');
    }

    const saved = await this.repo.findDashboardLayoutByUserId(userId);
    if (!saved) {
      return {
        version: DASHBOARD_LAYOUT_VERSION,
        layout: buildDefaultDashboardLayout(),
        updatedAt: null,
      };
    }

    const normalized = normalizeDashboardLayout(saved.layout);
    const hasDiff = JSON.stringify(normalized) !== JSON.stringify(saved.layout);
    if (hasDiff || saved.version !== DASHBOARD_LAYOUT_VERSION) {
      const repaired = await this.repo.upsertDashboardLayout(
        userId,
        normalized,
        DASHBOARD_LAYOUT_VERSION,
      );
      return {
        version: repaired.version,
        layout: normalizeDashboardLayout(repaired.layout),
        updatedAt: repaired.updatedAt.toISOString(),
      };
    }

    return {
      version: saved.version,
      layout: normalized,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async updateDashboardLayout(userId: number, layout: DashboardLayoutItem[]): Promise<DashboardLayoutData> {
    const foundUser = await this.repo.findProfileById(userId);
    if (!foundUser) {
      throw new AppError(ErrorCodes.Unauthorized, 'Account not found or deleted.');
    }

    const normalized = normalizeDashboardLayout(layout);
    const saved = await this.repo.upsertDashboardLayout(userId, normalized, DASHBOARD_LAYOUT_VERSION);
    return {
      version: saved.version,
      layout: normalizeDashboardLayout(saved.layout),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  private normalizeUserFilters(filters?: UserQueryFilters): {
    role?: UserRole;
    isActive?: boolean;
    createdFrom?: Date;
    createdTo?: Date;
  } {
    if (!filters) return {};

    const normalized: {
      role?: UserRole;
      isActive?: boolean;
      createdFrom?: Date;
      createdTo?: Date;
    } = {};

    if (filters.role) {
      normalized.role = filters.role;
    }
    if (typeof filters.isActive === 'boolean') {
      normalized.isActive = filters.isActive;
    }

    if (filters.createdFrom) {
      const fromDate = new Date(filters.createdFrom);
      if (!Number.isNaN(fromDate.getTime())) {
        normalized.createdFrom = fromDate;
      }
    }
    if (filters.createdTo) {
      const toDate = new Date(filters.createdTo);
      if (!Number.isNaN(toDate.getTime())) {
        normalized.createdTo = toDate;
      }
    }

    if (
      normalized.createdFrom &&
      normalized.createdTo &&
      normalized.createdFrom.getTime() > normalized.createdTo.getTime()
    ) {
      const swap = normalized.createdFrom;
      normalized.createdFrom = normalized.createdTo;
      normalized.createdTo = swap;
    }

    return normalized;
  }
}
