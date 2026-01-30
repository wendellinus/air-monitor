import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('RBAC (e2e)', () => {
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

  it('user forbidden; admin assigns operator; old token invalid; operator can access users list', async () => {
    // Create an admin user directly (no seed dependency).
    const adminUsername = `rbac_adm_${rand8()}`.slice(0, 20);
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    // Register a normal user.
    const username = `rbac_usr_${rand8()}`.slice(0, 20);
    const password = '123456';
    const reg = await request(t.app.getHttpServer()).post('/api/v1/register').send({ username, password });
    expect(reg.body.code).toBe(0);
    const userId: number = reg.body.data.id as number;
    createdUserIds.push(userId);

    const loginUser = await request(t.app.getHttpServer()).post('/api/v1/login').send({ username, password });
    expect(loginUser.body.code).toBe(0);
    const userToken: string = loginUser.body.data.token;

    // Normal user cannot access admin/operator-only endpoint.
    const listForbidden = await request(t.app.getHttpServer())
      .get('/api/v1/users?page=1&pageSize=10')
      .set('Authorization', `Bearer ${userToken}`);
    expect(listForbidden.body.code).toBe(40100);

    // Admin login to assign operator role.
    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password: adminPassword });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token;

    const setRole = await request(t.app.getHttpServer())
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'operator' });
    expect(setRole.body.code).toBe(0);

    // Old token should be invalid immediately (tokenInvalidBefore).
    const meAfterRoleChange = await request(t.app.getHttpServer())
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(meAfterRoleChange.body.code).toBe(40100);

    // Re-login and operator can access users list.
    const loginUser2 = await request(t.app.getHttpServer()).post('/api/v1/login').send({ username, password });
    expect(loginUser2.body.code).toBe(0);
    const opToken: string = loginUser2.body.data.token;

    const listOk = await request(t.app.getHttpServer())
      .get('/api/v1/users?page=1&pageSize=10')
      .set('Authorization', `Bearer ${opToken}`);
    expect(listOk.body.code).toBe(0);
  });
});

