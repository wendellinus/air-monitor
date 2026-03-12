import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../infra/prisma/prisma.service';
import type { UserRole } from '../../shared/authz/user-role';

export type PermissionEntity = {
  key: string;
  label: string;
  type: 'menu' | 'action';
  parentKey: string | null;
  sort: number;
};

@Injectable()
export class PermissionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async upsertPermissions(items: PermissionEntity[]): Promise<void> {
    for (const item of items) {
      await this.prisma.$executeRaw`
        INSERT INTO "Permission" ("key", "label", "type", "parentKey", "sort", "createdAt", "updatedAt")
        VALUES (${item.key}, ${item.label}, ${item.type}, ${item.parentKey}, ${item.sort}, NOW(), NOW())
        ON CONFLICT ("key")
        DO UPDATE SET
          "label" = EXCLUDED."label",
          "type" = EXCLUDED."type",
          "parentKey" = EXCLUDED."parentKey",
          "sort" = EXCLUDED."sort",
          "updatedAt" = NOW()
      `;
    }
  }

  async deletePermissionsByKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.prisma.$executeRaw`
      DELETE FROM "Permission"
      WHERE "key" IN (${Prisma.join(keys)})
    `;
  }

  async listPermissions(): Promise<PermissionEntity[]> {
    return this.prisma.$queryRaw<PermissionEntity[]>`
      SELECT
        "key",
        "label",
        "type",
        "parentKey",
        "sort"
      FROM "Permission"
      ORDER BY "sort" ASC, "key" ASC
    `;
  }

  async listRolePermissionKeys(role: UserRole): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ permissionKey: string }>>`
      SELECT "permissionKey"
      FROM "RolePermission"
      WHERE "role" = ${role}::"UserRole"
      ORDER BY "permissionKey" ASC
    `;
    return rows.map((item) => item.permissionKey);
  }

  async listUserDeniedPermissionKeys(userId: number): Promise<string[]> {
    const rows = await this.prisma.userDeniedPermission.findMany({
      where: { userId },
      orderBy: { permissionKey: 'asc' },
      select: { permissionKey: true },
    });
    return rows.map((item) => item.permissionKey);
  }

  async countRolePermission(role: UserRole): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ total: bigint }>>`
      SELECT COUNT(*)::bigint AS total
      FROM "RolePermission"
      WHERE "role" = ${role}::"UserRole"
    `;
    return Number(rows[0]?.total ?? 0n);
  }

  async replaceRolePermissions(role: UserRole, permissionKeys: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "RolePermission"
        WHERE "role" = ${role}::"UserRole"
      `;

      for (const key of permissionKeys) {
        await tx.$executeRaw`
          INSERT INTO "RolePermission" ("role", "permissionKey")
          VALUES (${role}::"UserRole", ${key})
          ON CONFLICT ("role", "permissionKey") DO NOTHING
        `;
      }
    });
  }

  async replaceUserDeniedPermissions(userId: number, permissionKeys: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userDeniedPermission.deleteMany({
        where: { userId },
      });

      if (permissionKeys.length === 0) {
        return;
      }

      await tx.userDeniedPermission.createMany({
        data: permissionKeys.map((permissionKey) => ({
          userId,
          permissionKey,
        })),
        skipDuplicates: true,
      });
    });
  }
}
