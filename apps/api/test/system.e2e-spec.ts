import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('System Config (e2e)', () => {
  let t: TestApp;
  const openedApps: TestApp[] = [];
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    t = await createTestApp();
    openedApps.push(t);
  });

  afterAll(async () => {
    await t.prisma.systemRuntimeConfig.deleteMany();
    if (createdUserIds.length > 0) {
      await t.prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await t.prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    for (const current of openedApps) {
      await current.app.close();
    }
  });

  it('persists polling interval across reads and app restarts', async () => {
    await t.prisma.systemRuntimeConfig.deleteMany();

    const adminUsername = `sys_adm_${rand8()}`.slice(0, 20);
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password: adminPassword });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token as string;

    const defaultAdminConfig = await request(t.app.getHttpServer())
      .get('/api/v1/admin/system/config')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(defaultAdminConfig.body.code).toBe(0);
    expect(defaultAdminConfig.body.data.pollingInterval).toBe(60000);

    const saveConfig = await request(t.app.getHttpServer())
      .post('/api/v1/admin/system/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pollingInterval: 120000 });
    expect(saveConfig.body.code).toBe(0);
    expect(saveConfig.body.data.pollingInterval).toBe(120000);

    const adminConfig = await request(t.app.getHttpServer())
      .get('/api/v1/admin/system/config')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminConfig.body.code).toBe(0);
    expect(adminConfig.body.data.pollingInterval).toBe(120000);

    const publicConfig = await request(t.app.getHttpServer()).get('/api/v1/system/config');
    expect(publicConfig.body.code).toBe(0);
    expect(publicConfig.body.data.pollingInterval).toBe(120000);

    const restarted = await createTestApp();
    openedApps.push(restarted);

    const publicConfigAfterRestart = await request(restarted.app.getHttpServer()).get('/api/v1/system/config');
    expect(publicConfigAfterRestart.body.code).toBe(0);
    expect(publicConfigAfterRestart.body.data.pollingInterval).toBe(120000);
  });
});
