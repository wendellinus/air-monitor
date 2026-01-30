import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function mustGetEnv(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  return v.trim();
}

async function ensureUser(username: string, password: string, role: 'admin' | 'operator'): Promise<void> {
  if (username.length > 20) {
    throw new Error(`初始化账号失败：用户名过长（最长 20），当前=${username.length}`);
  }

  const exists = await prisma.user.findFirst({
    where: { username, deletedAt: null },
    select: { id: true },
  });
  if (exists) {
    console.log(`初始化账号跳过：${username} 已存在`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash, isActive: true, role },
    select: { id: true },
  });
  console.log(`初始化账号成功：创建 ${role} 用户 ${username}`);
}

async function main(): Promise<void> {
  const adminUsername = mustGetEnv('INITIAL_ADMIN_USERNAME');
  const adminPassword = mustGetEnv('INITIAL_ADMIN_PASSWORD');
  const operatorUsername = mustGetEnv('INITIAL_OPERATOR_USERNAME');
  const operatorPassword = mustGetEnv('INITIAL_OPERATOR_PASSWORD');

  if (!adminUsername || !adminPassword) {
    console.log('未提供 INITIAL_ADMIN_USERNAME/INITIAL_ADMIN_PASSWORD，跳过初始化 admin。');
  } else {
    await ensureUser(adminUsername, adminPassword, 'admin');
  }

  if (!operatorUsername || !operatorPassword) {
    console.log('未提供 INITIAL_OPERATOR_USERNAME/INITIAL_OPERATOR_PASSWORD，跳过初始化 operator。');
  } else {
    await ensureUser(operatorUsername, operatorPassword, 'operator');
  }
}

main()
  .catch((e: unknown) => {
    console.error('初始化账号失败：', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

