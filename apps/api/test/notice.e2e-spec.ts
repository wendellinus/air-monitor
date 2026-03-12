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
});
