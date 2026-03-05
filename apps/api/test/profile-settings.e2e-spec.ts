import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function e2eUsername(): string {
  return `pf_${Math.random().toString(36).slice(2, 10)}`;
}

describe('Profile Settings (e2e)', () => {
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

  it('can read and update current user profile', async () => {
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

    const profileRes = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(profileRes.body.code).toBe(0);
    expect(profileRes.body.data.username).toBe(username);
    expect(profileRes.body.data.email).toBe(`${username}@example.com`);

    const nextUsername = e2eUsername();
    const updateRes = await request(t.app.getHttpServer())
      .put('/api/v1/user/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: nextUsername,
        email: `${nextUsername}@example.com`,
      });
    expect(updateRes.body.code).toBe(0);
    expect(updateRes.body.data.username).toBe(nextUsername);
    expect(updateRes.body.data.email).toBe(`${nextUsername}@example.com`);

    const meRes = await request(t.app.getHttpServer())
      .get('/api/v1/user/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.body.code).toBe(0);
    expect(meRes.body.data.username).toBe(nextUsername);
  });
});

