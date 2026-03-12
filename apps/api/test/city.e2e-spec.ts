import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('City Admin List (e2e)', () => {
  let t: TestApp;
  const createdUserIds: number[] = [];
  const createdCityIds: string[] = [];

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    if (createdCityIds.length > 0) {
      await t.prisma.city.deleteMany({ where: { cityId: { in: createdCityIds } } });
    }
    if (createdUserIds.length > 0) {
      await t.prisma.refreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await t.prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await t.app.close();
  });

  it('fetches subsequent city pages from the backend', async () => {
    const username = `city_adm_${rand8()}`.slice(0, 20);
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await t.prisma.user.create({
      data: { username, passwordHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    const citySeeds = [
      { cityId: `e2e_city_${rand8()}_1`.slice(0, 20), name: 'Alpha', adm1: 'A', adm2: 'A1' },
      { cityId: `e2e_city_${rand8()}_2`.slice(0, 20), name: 'Beta', adm1: 'B', adm2: 'B1' },
      { cityId: `e2e_city_${rand8()}_3`.slice(0, 20), name: 'Gamma', adm1: 'C', adm2: 'C1' },
    ];
    createdCityIds.push(...citySeeds.map((item) => item.cityId));

    await t.prisma.city.createMany({
      data: citySeeds.map((item) => ({
        cityId: item.cityId,
        name: item.name,
        lat: '10',
        lon: '20',
        adm1: item.adm1,
        adm2: item.adm2,
        country: 'CN',
      })),
    });

    const login = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username, password });
    expect(login.body.code).toBe(0);
    const token: string = login.body.data.token as string;

    const page1 = await request(t.app.getHttpServer())
      .get('/api/v1/city/admin/list?page=1&pageSize=2&keyword=e2e_city_')
      .set('Authorization', `Bearer ${token}`);
    expect(page1.body.code).toBe(0);
    expect(page1.body.data.total).toBe(3);
    expect(page1.body.data.list).toHaveLength(2);

    const page2 = await request(t.app.getHttpServer())
      .get('/api/v1/city/admin/list?page=2&pageSize=2&keyword=e2e_city_')
      .set('Authorization', `Bearer ${token}`);
    expect(page2.body.code).toBe(0);
    expect(page2.body.data.total).toBe(3);
    expect(page2.body.data.list).toHaveLength(1);
    expect(page2.body.data.list[0].cityId).not.toBe(page1.body.data.list[0].cityId);
  });
});
