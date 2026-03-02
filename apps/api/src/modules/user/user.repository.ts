import { Inject, Injectable } from '@nestjs/common';

import type { CityEntity } from '../city/city.repository';

import { PrismaService } from '../../infra/prisma/prisma.service';
import type { UserRole } from '../../shared/authz/user-role';

@Injectable()
export class UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async existsByUsername(username: string): Promise<boolean> {
    const found = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: { id: true },
    });
    return Boolean(found);
  }

  async findByUsername(username: string): Promise<{
    id: number;
    username: string;
    passwordHash: string;
    email: string | null;
    isActive: boolean;
  } | null> {
    return this.prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: { id: true, username: true, passwordHash: true, email: true, isActive: true },
    });
  }

  async list(
    page: number,
    pageSize: number,
  ): Promise<{
    list: Array<{
      id: number;
      username: string;
      email: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const [total, list] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);
    return { list, total };
  }

  async search(
    keyword: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<{
    list: Array<{
      id: number;
      username: string;
      email: string | null;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const where = keyword
      ? { deletedAt: null, username: { contains: keyword, mode: 'insensitive' as const } }
      : { deletedAt: null };

    const [total, list] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);
    return { list, total };
  }

  async findById(
    id: number,
  ): Promise<{
    id: number;
    username: string;
    isActive: boolean;
    role: UserRole;
    tokenInvalidBefore: Date | null;
  } | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, username: true, isActive: true, role: true, tokenInvalidBefore: true },
    });
  }

  async updateStatus(id: number, isActive: boolean, tokenInvalidBefore: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive, tokenInvalidBefore, tokenVersion: { increment: 1 } },
    });
  }

  async updatePassword(id: number, passwordHash: string, tokenInvalidBefore: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, tokenInvalidBefore, tokenVersion: { increment: 1 } },
    });
  }

  async updateRole(id: number, role: UserRole, tokenInvalidBefore: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { role, tokenInvalidBefore, tokenVersion: { increment: 1 } },
    });
  }

  async revokeAllRefreshTokens(userId: number, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async listFavoriteCities(userId: number): Promise<CityEntity[]> {
    return this.prisma.$queryRaw<CityEntity[]>`
      SELECT
        c."cityId",
        c."name",
        c."lat",
        c."lon",
        c."adm2",
        c."adm1",
        c."country"
      FROM "UserFavoriteCity" uf
      INNER JOIN "City" c ON c."cityId" = uf."cityId"
      WHERE uf."userId" = ${userId}
      ORDER BY uf."createdAt" DESC
    `;
  }

  async addFavoriteCity(userId: number, cityId: string): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "UserFavoriteCity" ("userId", "cityId")
      VALUES (${userId}, ${cityId})
      ON CONFLICT ("userId", "cityId") DO NOTHING
    `;
  }

  async removeFavoriteCity(userId: number, cityId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM "UserFavoriteCity"
      WHERE "userId" = ${userId} AND "cityId" = ${cityId}
    `;
  }
}
