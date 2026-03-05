import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('Provider Account (e2e)', () => {
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

  it('overview requires login', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/v1/admin/provider-accounts/overview');
    expect(res.body.code).toBe(40100);
  });

  it('admin can read+refresh, operator can read but cannot refresh', async () => {
    const adminUsername = `quota_adm_${rand8()}`.slice(0, 20);
    const operatorUsername = `quota_op_${rand8()}`.slice(0, 20);
    const password = 'pass1234';

    const adminHash = await bcrypt.hash(password, 10);
    const operatorHash = await bcrypt.hash(password, 10);

    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    const operator = await t.prisma.user.create({
      data: { username: operatorUsername, passwordHash: operatorHash, isActive: true, role: 'operator' },
      select: { id: true },
    });
    createdUserIds.push(admin.id, operator.id);

    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token as string;

    const roleTree = await request(t.app.getHttpServer())
      .get('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(roleTree.body.code).toBe(0);
    const selectedKeys: string[] = roleTree.body.data.selectedKeys as string[];
    const nextKeys = Array.from(new Set([...selectedKeys, 'apiQuota.view']));

    const updateRole = await request(t.app.getHttpServer())
      .put('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permissionKeys: nextKeys });
    expect(updateRole.body.code).toBe(0);

    const overviewByAdmin = await request(t.app.getHttpServer())
      .get('/api/v1/admin/provider-accounts/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(overviewByAdmin.body.code).toBe(0);
    expect(Array.isArray(overviewByAdmin.body.data.providers)).toBe(true);

    const refreshByAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/admin/provider-accounts/refresh')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(refreshByAdmin.body.code).toBe(0);

    const loginOperator = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: operatorUsername, password });
    expect(loginOperator.body.code).toBe(0);
    const operatorToken: string = loginOperator.body.data.token as string;

    const overviewByOperator = await request(t.app.getHttpServer())
      .get('/api/v1/admin/provider-accounts/overview')
      .set('Authorization', `Bearer ${operatorToken}`);
    expect(overviewByOperator.body.code).toBe(0);

    const refreshByOperator = await request(t.app.getHttpServer())
      .post('/api/v1/admin/provider-accounts/refresh')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({});
    expect(refreshByOperator.body.code).toBe(40100);
  });
});
