import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function e2eUsername(): string {
  // DB constraint: User.username is VARCHAR(20)
  return `e2e_${Math.random().toString(36).slice(2, 10)}`;
}

describe('Auth (e2e)', () => {
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

  it('register -> login -> me -> refresh -> logout -> token becomes invalid', async () => {
    const username = e2eUsername();
    const password = '123456';

    const reg = await request(t.app.getHttpServer())
      .post('/api/v1/register')
      .send({ username, password, email: `${username}@example.com` });

    expect(reg.body.code).toBe(0);
    createdUserIds.push(reg.body.data.id as number);
    expect(reg.body.data.username).toBe(username);

    const login = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username, password });

    expect(login.body.code).toBe(0);
    const token: string = login.body.data.token;
    const refreshToken: string = login.body.data.refreshToken;
    expect(typeof token).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const me = await request(t.app.getHttpServer())
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.body.code).toBe(0);
    expect(me.body.data.username).toBe(username);
    expect(me.body.data.locale).toBe('zh-CN');

    const updateLocale = await request(t.app.getHttpServer())
      .post('/api/v1/user/me/locale')
      .set('Authorization', `Bearer ${token}`)
      .send({ locale: 'en-US' });

    expect(updateLocale.body.code).toBe(0);
    expect(updateLocale.body.data.locale).toBe('en-US');

    const meAfterLocaleUpdate = await request(t.app.getHttpServer())
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meAfterLocaleUpdate.body.code).toBe(0);
    expect(meAfterLocaleUpdate.body.data.locale).toBe('en-US');

    const refreshed = await request(t.app.getHttpServer())
      .post('/api/v1/refresh')
      .send({ refreshToken });

    expect(refreshed.body.code).toBe(0);
    expect(typeof refreshed.body.data.accessToken).toBe('string');
    expect(typeof refreshed.body.data.refreshToken).toBe('string');

    const logout = await request(t.app.getHttpServer())
      .post('/api/v1/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logout.body.code).toBe(0);

    const meAfterLogout = await request(t.app.getHttpServer())
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meAfterLogout.body.code).toBe(40100);
  });
});
