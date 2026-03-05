import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('Permission (e2e)', () => {
  let t: TestApp;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await t.prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await t.prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await t.app.close();
  });

  it('initializes permissions and allows admin to read/update role permission tree', async () => {
    const adminUsername = `perm_adm_${rand8()}`.slice(0, 20);
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    const operatorUsername = `perm_op_${rand8()}`.slice(0, 20);
    const operatorPassword = 'operator123';
    const operatorHash = await bcrypt.hash(operatorPassword, 10);
    const operator = await t.prisma.user.create({
      data: { username: operatorUsername, passwordHash: operatorHash, isActive: true, role: 'operator' },
      select: { id: true },
    });
    createdUserIds.push(operator.id);

    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password: adminPassword });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token as string;

    const myPermissions = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/permissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(myPermissions.body.code).toBe(0);
    expect(Array.isArray(myPermissions.body.data.permissions)).toBe(true);
    expect(myPermissions.body.data.permissions).toContain('permissions.view');

    const roleTree = await request(t.app.getHttpServer())
      .get('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(roleTree.body.code).toBe(0);
    expect(Array.isArray(roleTree.body.data.tree)).toBe(true);
    expect(roleTree.body.data.tree.length).toBeGreaterThan(0);
    expect(Array.isArray(roleTree.body.data.selectedKeys)).toBe(true);

    const selectedKeys: string[] = roleTree.body.data.selectedKeys as string[];

    const updateRoleTree = await request(t.app.getHttpServer())
      .put('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permissionKeys: selectedKeys });
    expect(updateRoleTree.body.code).toBe(0);
    expect(Array.isArray(updateRoleTree.body.data.selectedKeys)).toBe(true);

    const loginOperator = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: operatorUsername, password: operatorPassword });
    expect(loginOperator.body.code).toBe(0);
    const operatorToken: string = loginOperator.body.data.token as string;

    const operatorReadTree = await request(t.app.getHttpServer())
      .get('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${operatorToken}`);
    expect(operatorReadTree.body.code).toBe(40100);
  });
});
