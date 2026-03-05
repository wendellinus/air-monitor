import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { CityEntity } from '../city/city.repository';

import type { DashboardLayoutItem } from '@air-monitor/shared';

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

  async findProfileById(
    id: number,
  ): Promise<{
    id: number;
    username: string;
    role: UserRole;
    locale: string;
  } | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; username: string; role: UserRole; locale: string }>
    >`
      SELECT "id", "username", "role", "locale"
      FROM "User"
      WHERE "id" = ${id} AND "deletedAt" IS NULL
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async findSelfProfileById(
    id: number,
  ): Promise<{
    id: number;
    username: string;
    email: string | null;
    role: UserRole;
    locale: string;
  } | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, username: true, email: true, role: true, locale: true },
    });
  }

  async updateSelfProfile(
    id: number,
    profile: { username: string; email: string | null },
  ): Promise<{
    id: number;
    username: string;
    email: string | null;
    role: UserRole;
    locale: string;
  }> {
    return this.prisma.user.update({
      where: { id },
      data: { username: profile.username, email: profile.email },
      select: { id: true, username: true, email: true, role: true, locale: true },
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

  async updateLocale(id: number, locale: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "User"
      SET "locale" = ${locale}
      WHERE "id" = ${id}
    `;
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

  async listFavoriteCitiesForAdmin(
    page: number,
    pageSize: number,
    keyword: string | undefined,
  ): Promise<{
    list: Array<{
      userId: number;
      username: string;
      cityId: string;
      cityName: string;
      adm1: string;
      adm2: string;
      country: string;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const likeKeyword = keyword?.trim() ? `%${keyword.trim()}%` : null;
    const where = likeKeyword
      ? Prisma.sql`WHERE (
          u."username" ILIKE ${likeKeyword}
          OR c."name" ILIKE ${likeKeyword}
          OR c."adm1" ILIKE ${likeKeyword}
          OR c."adm2" ILIKE ${likeKeyword}
          OR c."country" ILIKE ${likeKeyword}
        )`
      : Prisma.empty;

    const [countRows, list] = await this.prisma.$transaction([
      this.prisma.$queryRaw<Array<{ total: bigint }>>`
        SELECT COUNT(*)::bigint AS total
        FROM "UserFavoriteCity" uf
        INNER JOIN "User" u ON u."id" = uf."userId" AND u."deletedAt" IS NULL
        INNER JOIN "City" c ON c."cityId" = uf."cityId"
        ${where}
      `,
      this.prisma.$queryRaw<
        Array<{
          userId: number;
          username: string;
          cityId: string;
          cityName: string;
          adm1: string;
          adm2: string;
          country: string;
          createdAt: Date;
        }>
      >`
        SELECT
          uf."userId",
          u."username",
          uf."cityId",
          c."name" AS "cityName",
          c."adm1",
          c."adm2",
          c."country",
          uf."createdAt"
        FROM "UserFavoriteCity" uf
        INNER JOIN "User" u ON u."id" = uf."userId" AND u."deletedAt" IS NULL
        INNER JOIN "City" c ON c."cityId" = uf."cityId"
        ${where}
        ORDER BY uf."createdAt" DESC
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `,
    ]);

    return {
      list,
      total: Number(countRows[0]?.total ?? 0n),
    };
  }

  async findDashboardLayoutByUserId(
    userId: number,
  ): Promise<{
    layout: DashboardLayoutItem[];
    version: number;
    updatedAt: Date;
  } | null> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        layout: unknown;
        version: number;
        updatedAt: Date;
      }>
    >`
      SELECT "layout", "version", "updatedAt"
      FROM "UserDashboardLayout"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    const found = rows[0];
    if (!found) return null;
    return {
      layout: Array.isArray(found.layout) ? (found.layout as DashboardLayoutItem[]) : [],
      version: found.version,
      updatedAt: found.updatedAt,
    };
  }

  async upsertDashboardLayout(
    userId: number,
    layout: DashboardLayoutItem[],
    version: number,
  ): Promise<{
    layout: DashboardLayoutItem[];
    version: number;
    updatedAt: Date;
  }> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        layout: unknown;
        version: number;
        updatedAt: Date;
      }>
    >(Prisma.sql`
      INSERT INTO "UserDashboardLayout"
        ("userId", "layout", "version", "createdAt", "updatedAt")
      VALUES
        (${userId}, ${JSON.stringify(layout)}::jsonb, ${version}, NOW(), NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET
        "layout" = EXCLUDED."layout",
        "version" = EXCLUDED."version",
        "updatedAt" = NOW()
      RETURNING "layout", "version", "updatedAt"
    `);
    const saved = rows[0];
    if (!saved) {
      throw new Error('dashboard layout save failed');
    }

    return {
      layout: Array.isArray(saved.layout) ? (saved.layout as DashboardLayoutItem[]) : [],
      version: saved.version,
      updatedAt: saved.updatedAt,
    };
  }
}
