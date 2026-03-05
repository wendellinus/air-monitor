import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type {
  AdminFavoriteCityItem,
  AdminFavoriteCityListData,
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

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly repo: UserRepository,
    @Inject(CityService) private readonly cityService: CityService,
  ) {}

  async getMe(userId: number): Promise<MeResponseData> {
    const found = await this.repo.findProfileById(userId);
    if (!found) {
      throw new AppError(ErrorCodes.Unauthorized, '账号不存在或已删除');
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
      throw new AppError(ErrorCodes.Unauthorized, '\u8d26\u6237\u4e0d\u5b58\u5728\u6216\u5df2\u5220\u9664');
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
      throw new AppError(ErrorCodes.Unauthorized, '\u8d26\u6237\u4e0d\u5b58\u5728\u6216\u5df2\u5220\u9664');
    }

    if (payload.username !== found.username) {
      const existsUser = await this.repo.findByUsername(payload.username);
      if (existsUser && existsUser.id !== userId) {
        throw new AppError(ErrorCodes.ParamError, '\u7528\u6237\u540d\u5df2\u5b58\u5728');
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

  async getUserList(page: number, pageSize: number): Promise<UserListData> {
    const { list, total } = await this.repo.list(page, pageSize);
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
  ): Promise<UserListData> {
    const { list, total } = await this.repo.search(keyword, page, pageSize);
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
    if (!found) throw new AppError(ErrorCodes.ParamError, '用户不存在');

    const now = new Date();
    await this.repo.updateStatus(id, isActive, now);
    await this.repo.revokeAllRefreshTokens(id, now);
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new AppError(ErrorCodes.ParamError, '用户不存在');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date();
    await this.repo.updatePassword(id, passwordHash, now);
    await this.repo.revokeAllRefreshTokens(id, now);
  }

  async setUserRole(id: number, role: UserRole): Promise<void> {
    const found = await this.repo.findById(id);
    if (!found) throw new AppError(ErrorCodes.ParamError, '用户不存在');

    const now = new Date();
    await this.repo.updateRole(id, role, now);
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
      throw new AppError(ErrorCodes.Unauthorized, '账号不存在或已删除');
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
      throw new AppError(ErrorCodes.Unauthorized, '账户不存在或已删除');
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
      throw new AppError(ErrorCodes.Unauthorized, '账户不存在或已删除');
    }

    const normalized = normalizeDashboardLayout(layout);
    const saved = await this.repo.upsertDashboardLayout(userId, normalized, DASHBOARD_LAYOUT_VERSION);
    return {
      version: saved.version,
      layout: normalizeDashboardLayout(saved.layout),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }
}
