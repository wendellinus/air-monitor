import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

describe('Protected routes (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('provider summary requires login', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/v1/provider/summary');
    expect(res.body.code).toBe(40100);
  });
});
