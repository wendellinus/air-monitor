import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('Notice (e2e)', () => {
  let t: TestApp;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.prisma.notice.deleteMany({
      where: {
        OR: [
          { createdByName: { startsWith: 'notice_' } },
          { title: { startsWith: 'Notice e2e ' } },
        ],
      },
    });

    if (createdUserIds.length > 0) {
      await t.prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await t.prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }

    await t.app.close();
  });

  it('stores and returns the specific operator name for manual notices', async () => {
    const username = `notice_${rand8()}`.slice(0, 20);
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await t.prisma.user.create({
      data: { username, passwordHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    const login = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username, password });
    expect(login.body.code).toBe(0);
    const token: string = login.body.data.token as string;

    const createRes = await request(t.app.getHttpServer())
      .post('/api/v1/admin/notices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Notice e2e ${rand8()}`,
        level: 'info',
        startTime: new Date(Date.now() + 60_000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    expect(createRes.body.code).toBe(0);

    const listRes = await request(t.app.getHttpServer())
      .get('/api/v1/admin/notices?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.code).toBe(0);

    const created = (listRes.body.data.list as Array<{ id: number; createdByName?: string }>).find(
      (item) => item.id === createRes.body.data.id,
    );
    expect(created).toBeDefined();
    expect(created?.createdByName).toBe(username);
  });

  it('lets a user-role account list admin notices after notices.view is explicitly granted', async () => {
    const adminUsername = `notice_adm_${rand8()}`.slice(0, 20);
    const userUsername = `notice_usr_${rand8()}`.slice(0, 20);
    const password = 'admin123';
    const adminHash = await bcrypt.hash(password, 10);
    const userHash = await bcrypt.hash(password, 10);

    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    const user = await t.prisma.user.create({
      data: { username: userUsername, passwordHash: userHash, isActive: true, role: 'user' },
      select: { id: true },
    });
    createdUserIds.push(admin.id, user.id);

    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token as string;

    const originalTree = await request(t.app.getHttpServer())
      .get('/api/v1/admin/permissions/roles/user')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(originalTree.body.code).toBe(0);
    const originalKeys: string[] = originalTree.body.data.selectedKeys as string[];

    try {
      const createRes = await request(t.app.getHttpServer())
        .post('/api/v1/admin/notices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Notice e2e ${rand8()}`,
          level: 'info',
          startTime: new Date(Date.now() + 60_000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      expect(createRes.body.code).toBe(0);

      const grantUserRole = await request(t.app.getHttpServer())
        .put('/api/v1/admin/permissions/roles/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionKeys: ['notices.view'] });
      expect(grantUserRole.body.code).toBe(0);

      const loginUser = await request(t.app.getHttpServer())
        .post('/api/v1/login')
        .send({ username: userUsername, password });
      expect(loginUser.body.code).toBe(0);
      const userToken: string = loginUser.body.data.token as string;

      const myPermissions = await request(t.app.getHttpServer())
        .get('/api/v1/user/me/permissions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(myPermissions.body.code).toBe(0);
      expect(myPermissions.body.data.permissions).toContain('notices.view');

      const listRes = await request(t.app.getHttpServer())
        .get('/api/v1/admin/notices?page=1&pageSize=10')
        .set('Authorization', `Bearer ${userToken}`);
      expect(listRes.body.code).toBe(0);
      expect(Array.isArray(listRes.body.data.list)).toBe(true);
    } finally {
      await request(t.app.getHttpServer())
        .put('/api/v1/admin/permissions/roles/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissionKeys: originalKeys });
    }
  });
});
