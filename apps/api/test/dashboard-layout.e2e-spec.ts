import request = require('supertest');
import { DashboardWidgetIds, type DashboardLayoutItem } from '@air-monitor/shared';

import { createTestApp, type TestApp } from './test-app';

function e2eUsername(): string {
  return `lyt_${Math.random().toString(36).slice(2, 10)}`;
}

describe('Dashboard Layout (e2e)', () => {
  let t: TestApp;
  const createdUserIds: number[] = [];

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      const userIdsSql = createdUserIds.map((id) => Number(id)).join(',');
      await t.prisma.$executeRawUnsafe(`
        DELETE FROM "UserDashboardLayout"
        WHERE "userId" IN (${userIdsSql})
      `);
      await t.prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await t.prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await t.app.close();
  });

  it('returns default layout and supports per-user persist', async () => {
    const username = e2eUsername();
    const password = '123456';

    const registerRes = await request(t.app.getHttpServer())
      .post('/api/v1/register')
      .send({ username, password, email: `${username}@example.com` });
    expect(registerRes.body.code).toBe(0);
    createdUserIds.push(registerRes.body.data.id as number);

    const loginRes = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username, password });
    expect(loginRes.body.code).toBe(0);
    const token: string = loginRes.body.data.token as string;

    const defaultRes = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/dashboard-layout')
      .set('Authorization', `Bearer ${token}`);
    expect(defaultRes.body.code).toBe(0);
    const defaultLayout = defaultRes.body.data.layout as DashboardLayoutItem[];
    expect(defaultLayout.length).toBe(DashboardWidgetIds.length);
    expect(defaultRes.body.data.updatedAt).toBeNull();

    const reversed = [...DashboardWidgetIds].reverse();
    const nextLayout: DashboardLayoutItem[] = reversed.map((id, index) => ({
      id,
      order: index,
      pinned: id === reversed[0],
      colSpan: id === 'chart-status' || id === 'chart-trend' || id === 'panel-recent-notices' ? 2 : 1,
      rowSpan: id === 'chart-status' || id === 'chart-trend' || id === 'panel-recent-notices' ? 2 : 1,
    }));

    const updateRes = await request(t.app.getHttpServer())
      .put('/api/v1/user/me/dashboard-layout')
      .set('Authorization', `Bearer ${token}`)
      .send({ layout: nextLayout });
    expect(updateRes.body.code).toBe(0);
    expect(typeof updateRes.body.data.updatedAt).toBe('string');
    expect(updateRes.body.data.layout[0].id).toBe(reversed[0]);
    expect(updateRes.body.data.layout[0].pinned).toBe(true);

    const readBackRes = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/dashboard-layout')
      .set('Authorization', `Bearer ${token}`);
    expect(readBackRes.body.code).toBe(0);
    expect(readBackRes.body.data.layout[0].id).toBe(reversed[0]);
    expect(readBackRes.body.data.layout[0].pinned).toBe(true);
    expect(readBackRes.body.data.layout.length).toBe(DashboardWidgetIds.length);
  });
});
