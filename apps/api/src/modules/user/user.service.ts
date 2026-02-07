import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { UserListData, UserListItem } from '@air-monitor/shared';

import { AppError } from '../../shared/app-error';
import type { UserRole } from '../../shared/authz/user-role';
import { ErrorCodes } from '../../shared/error-codes';

import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(@Inject(UserRepository) private readonly repo: UserRepository) {}

  async getUserList(page: number, pageSize: number): Promise<UserListData> {
    const { list, total } = await this.repo.list(page, pageSize);
    return {
      list: list.map<UserListItem>((u) => ({ id: u.id, username: u.username, email: u.email ?? undefined })),
      total,
      page,
      pageSize,
    };
  }

  async searchUsers(keyword: string | undefined, page: number, pageSize: number): Promise<UserListData> {
    const { list, total } = await this.repo.search(keyword, page, pageSize);
    return {
      list: list.map<UserListItem>((u) => ({ id: u.id, username: u.username, email: u.email ?? undefined })),
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
}
