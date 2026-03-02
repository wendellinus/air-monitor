import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { CityItem, UserListData, UserListItem } from '@air-monitor/shared';

import { AppError } from '../../shared/app-error';
import type { UserRole } from '../../shared/authz/user-role';
import { ErrorCodes } from '../../shared/error-codes';
import { CityService } from '../city/city.service';

import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly repo: UserRepository,
    @Inject(CityService) private readonly cityService: CityService,
  ) {}

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
}
