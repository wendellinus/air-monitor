import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

describe('City/Air (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    // Cleanup e2e-created city rows (we use fixed ids).
    await t.prisma.airQualityLog.deleteMany({ where: { cityId: '101010100' } });
    await t.prisma.city.deleteMany({ where: { cityId: '101010100' } });
    await t.app.close();
  });

  it('city/top works (stubbed QWeather)', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/v1/city/top?rangeType=world&number=3');
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('city/search works (stubbed QWeather)', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/v1/city/search?keyword=beijing');
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].cityId).toBe('101010100');
  });

  it('air/now works when city exists', async () => {
    await t.prisma.city.upsert({
      where: { cityId: '101010100' },
      update: { name: '北京', lat: '39.9042', lon: '116.4074', adm2: '北京', adm1: '北京', country: '中国' },
      create: { cityId: '101010100', name: '北京', lat: '39.9042', lon: '116.4074', adm2: '北京', adm1: '北京', country: '中国' },
    });

    const res = await request(t.app.getHttpServer()).get('/api/v1/air/now?city_id=101010100');
    expect(res.body.code).toBe(0);
    expect(res.body.data.cityId).toBe('101010100');
    expect(typeof res.body.data.aqi).toBe('number');
  });
});
