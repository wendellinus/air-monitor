import * as bcrypt from 'bcryptjs';
import request = require('supertest');

import { createTestApp, type TestApp } from './test-app';

function rand8(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe('Permission (e2e)', () => {
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

  it('initializes permissions and allows admin to read/update role permission tree', async () => {
    const adminUsername = `perm_adm_${rand8()}`.slice(0, 20);
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    const operatorUsername = `perm_op_${rand8()}`.slice(0, 20);
    const operatorPassword = 'operator123';
    const operatorHash = await bcrypt.hash(operatorPassword, 10);
    const operator = await t.prisma.user.create({
      data: { username: operatorUsername, passwordHash: operatorHash, isActive: true, role: 'operator' },
      select: { id: true },
    });
    createdUserIds.push(operator.id);

    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password: adminPassword });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token as string;

    const myPermissions = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/permissions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(myPermissions.body.code).toBe(0);
    expect(Array.isArray(myPermissions.body.data.permissions)).toBe(true);
    expect(myPermissions.body.data.permissions).toContain('permissions.view');
    expect(myPermissions.body.data.permissions).toContain('users.create');

    const roleTree = await request(t.app.getHttpServer())
      .get('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(roleTree.body.code).toBe(0);
    expect(Array.isArray(roleTree.body.data.tree)).toBe(true);
    expect(roleTree.body.data.tree.length).toBeGreaterThan(0);
    expect(Array.isArray(roleTree.body.data.selectedKeys)).toBe(true);
    const serializedTree = JSON.stringify(roleTree.body.data.tree);
    expect(serializedTree).toContain('"key":"users.create"');

    const selectedKeys: string[] = roleTree.body.data.selectedKeys as string[];

    const updateRoleTree = await request(t.app.getHttpServer())
      .put('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permissionKeys: selectedKeys });
    expect(updateRoleTree.body.code).toBe(0);
    expect(Array.isArray(updateRoleTree.body.data.selectedKeys)).toBe(true);

    const loginOperator = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: operatorUsername, password: operatorPassword });
    expect(loginOperator.body.code).toBe(0);
    const operatorToken: string = loginOperator.body.data.token as string;

    const operatorReadTree = await request(t.app.getHttpServer())
      .get('/api/v1/admin/permissions/roles/operator')
      .set('Authorization', `Bearer ${operatorToken}`);
    expect(operatorReadTree.body.code).toBe(40100);
  });

  it('lets user role access self favorites but not admin favorites management', async () => {
    const username = `perm_usr_${rand8()}`.slice(0, 20);
    const password = 'user12345';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await t.prisma.user.create({
      data: { username, passwordHash, isActive: true, role: 'user' },
      select: { id: true },
    });
    createdUserIds.push(user.id);

    const login = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username, password });
    expect(login.body.code).toBe(0);
    const token: string = login.body.data.token as string;

    const myPermissions = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(myPermissions.body.code).toBe(0);
    expect(myPermissions.body.data.permissions).toContain('favorites.view');
    expect(myPermissions.body.data.permissions).toContain('favorites.delete');

    const adminFavorites = await request(t.app.getHttpServer())
      .get('/api/v1/admin/users/favorites/cities?page=1&pageSize=10')
      .set('Authorization', `Bearer ${token}`);
    expect(adminFavorites.body.code).toBe(40100);

    const selfFavorites = await request(t.app.getHttpServer())
      .get('/api/v1/user/favorites/cities')
      .set('Authorization', `Bearer ${token}`);
    expect(selfFavorites.body.code).toBe(0);
    expect(Array.isArray(selfFavorites.body.data)).toBe(true);
  });

  it('supports admin user detail update, per-user permission reduction, and soft delete', async () => {
    const adminUsername = `usr_adm_${rand8()}`.slice(0, 20);
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await t.prisma.user.create({
      data: { username: adminUsername, passwordHash: adminHash, isActive: true, role: 'admin' },
      select: { id: true },
    });
    createdUserIds.push(admin.id);

    const targetUsername = `usr_op_${rand8()}`.slice(0, 20);
    const targetPassword = 'operator123';

    const loginAdmin = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: adminUsername, password: adminPassword });
    expect(loginAdmin.body.code).toBe(0);
    const adminToken: string = loginAdmin.body.data.token as string;

    const createRes = await request(t.app.getHttpServer())
      .post('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: targetUsername,
        password: targetPassword,
        role: 'operator',
        isActive: true,
        email: `${targetUsername}@example.com`,
      });
    expect(createRes.body.code).toBe(0);
    expect(createRes.body.data.username).toBe(targetUsername);
    expect(createRes.body.data.role).toBe('operator');
    expect(createRes.body.data.rolePermissionKeys).toContain('users.create');
    createdUserIds.push(createRes.body.data.id as number);

    const detailRes = await request(t.app.getHttpServer())
      .get(`/api/v1/admin/users/${createRes.body.data.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detailRes.body.code).toBe(0);
    expect(detailRes.body.data.username).toBe(targetUsername);
    expect(detailRes.body.data.rolePermissionKeys).toContain('users.profile.update');

    const renamedUsername = `ren_${rand8()}`.slice(0, 20);
    const updateRes = await request(t.app.getHttpServer())
      .patch(`/api/v1/admin/users/${createRes.body.data.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: renamedUsername,
        isActive: true,
        deniedPermissionKeys: ['users.profile.update'],
      });
    expect(updateRes.body.code).toBe(0);
    expect(updateRes.body.data.username).toBe(renamedUsername);
    expect(updateRes.body.data.deniedPermissionKeys).toContain('users.profile.update');
    expect(updateRes.body.data.effectivePermissionKeys).not.toContain('users.profile.update');

    const loginTarget = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: renamedUsername, password: targetPassword });
    expect(loginTarget.body.code).toBe(0);
    const targetToken: string = loginTarget.body.data.token as string;

    const myPermissions = await request(t.app.getHttpServer())
      .get('/api/v1/user/me/permissions')
      .set('Authorization', `Bearer ${targetToken}`);
    expect(myPermissions.body.code).toBe(0);
    expect(myPermissions.body.data.permissions).not.toContain('users.profile.update');
    expect(myPermissions.body.data.permissions).toContain('users.view');

    const deleteRes = await request(t.app.getHttpServer())
      .delete(`/api/v1/admin/users/${createRes.body.data.id as number}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.body.code).toBe(0);

    const deletedUser = await t.prisma.user.findUnique({
      where: { id: createRes.body.data.id as number },
      select: { deletedAt: true, username: true, isActive: true },
    });
    expect(deletedUser?.deletedAt).toBeTruthy();
    expect(deletedUser?.username).not.toBe(renamedUsername);
    expect(deletedUser?.isActive).toBe(false);

    const listRes = await request(t.app.getHttpServer())
      .get(`/api/v1/users/search?page=1&pageSize=20&keyword=${renamedUsername}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.body.code).toBe(0);
    expect(listRes.body.data.list).toHaveLength(0);

    const reloginDeleted = await request(t.app.getHttpServer())
      .post('/api/v1/login')
      .send({ username: renamedUsername, password: targetPassword });
    expect(reloginDeleted.body.code).not.toBe(0);
  });
});
