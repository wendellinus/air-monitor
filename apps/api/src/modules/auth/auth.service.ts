import { createHash, randomUUID } from 'crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type Redis from 'ioredis';


import { PrismaService } from '../../infra/prisma/prisma.service';
import { REDIS_CLIENT } from '../../infra/redis/redis.constants';
import { AppError } from '../../shared/app-error';
import type { UserRole } from '../../shared/authz/user-role';
import { EnvService } from '../../shared/env/env.service';
import { ErrorCodes } from '../../shared/error-codes';

import { REFRESH_JWT_SERVICE } from './auth.constants';
import type { JwtUser } from './types';

type Tokens = { accessToken: string; refreshToken: string };

type RefreshPayload = { userId: number; username: string; jti: string; ver: number; typ: 'refresh'; exp: number; iat: number };
type AccessPayload = { userId: number; username: string; jti: string; ver: number };

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
    private readonly jwt: JwtService,
    @Inject(REFRESH_JWT_SERVICE) private readonly refreshJwt: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async register(username: string, password: string, email?: string): Promise<{ id: number; username: string; email?: string }> {
    const exists = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: { id: true },
    });
    if (exists) {
      throw new AppError(ErrorCodes.ParamError, '用户名已存在');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, passwordHash, email: email ?? null, isActive: true },
      select: { id: true, username: true, email: true },
    });
    return { id: user.id, username: user.username, email: user.email ?? undefined };
  }

  private async issueTokens(user: { id: number; username: string; tokenVersion: number }): Promise<Tokens> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const accessPayload: AccessPayload = { userId: user.id, username: user.username, jti: accessJti, ver: user.tokenVersion };
    const refreshPayload: Omit<RefreshPayload, 'exp' | 'iat'> = {
      userId: user.id,
      username: user.username,
      jti: refreshJti,
      ver: user.tokenVersion,
      typ: 'refresh',
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.env.jwtAccessSecret,
      expiresIn: this.env.jwtAccessExpiresIn,
    });
    const refreshToken = await this.refreshJwt.signAsync(refreshPayload, {
      secret: this.env.jwtRefreshSecret,
      expiresIn: this.env.jwtRefreshExpiresIn,
    });

    const decoded = this.refreshJwt.decode(refreshToken) as RefreshPayload | null;
    if (!decoded?.exp) {
      throw new AppError(ErrorCodes.ServerBusy, '生成 Refresh Token 失败');
    }

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        jti: refreshJti,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; refreshToken: string; user: { id: number; username: string; email?: string; role: UserRole } }> {
    const user = await this.prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: { id: true, username: true, passwordHash: true, email: true, isActive: true, role: true, tokenInvalidBefore: true, tokenVersion: true },
    });
    if (!user) {
      throw new AppError(ErrorCodes.Unauthorized, '用户名或密码错误');
    }
    if (!user.isActive) {
      throw new AppError(ErrorCodes.Unauthorized, '账号已禁用，请联系管理员');
    }
    if (user.tokenInvalidBefore) {
      // User might have been force-logged-out by admin operations.
      // A fresh login is always allowed, so we don't block here; keep it for refresh/validate checks.
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError(ErrorCodes.Unauthorized, '用户名或密码错误');
    }

    const tokens = await this.issueTokens({ id: user.id, username: user.username, tokenVersion: user.tokenVersion });
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, username: user.username, email: user.email ?? undefined, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<Tokens> {
    let payload: RefreshPayload;
    try {
      payload = (await this.refreshJwt.verifyAsync(refreshToken, {
        secret: this.env.jwtRefreshSecret,
      })) as RefreshPayload;
    } catch {
      throw new AppError(ErrorCodes.Unauthorized, 'Refresh Token 无效');
    }

    if (payload.typ !== 'refresh') {
      throw new AppError(ErrorCodes.Unauthorized, 'Refresh Token 无效');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
      select: {
        id: true,
        userId: true,
        tokenHash: true,
        revokedAt: true,
        expiresAt: true,
        user: { select: { id: true, username: true, isActive: true, role: true, tokenInvalidBefore: true, tokenVersion: true, deletedAt: true } },
      },
    });
    if (!stored || stored.userId !== payload.userId) {
      throw new AppError(ErrorCodes.Unauthorized, 'Refresh Token 无效');
    }
    if (!stored.user || stored.user.deletedAt) {
      throw new AppError(ErrorCodes.Unauthorized, '账号不存在或已删除');
    }
    if (!stored.user.isActive) {
      throw new AppError(ErrorCodes.Unauthorized, '账号已禁用，请联系管理员');
    }
    if (payload.ver !== stored.user.tokenVersion) {
      throw new AppError(ErrorCodes.Unauthorized, '登录已失效，请重新登录');
    }
    if (stored.user.tokenInvalidBefore) {
      const invalidBeforeSec = Math.floor(stored.user.tokenInvalidBefore.getTime() / 1000);
      if (payload.iat < invalidBeforeSec) {
        throw new AppError(ErrorCodes.Unauthorized, '登录已失效，请重新登录');
      }
    }
    if (stored.revokedAt) {
      throw new AppError(ErrorCodes.Unauthorized, 'Refresh Token 已撤销');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new AppError(ErrorCodes.Unauthorized, 'Refresh Token 已过期');
    }
    if (stored.tokenHash !== sha256(refreshToken)) {
      // Token reuse detected: revoke all tokens for the user.
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError(ErrorCodes.Unauthorized, '检测到 Refresh Token 复用（疑似泄露），已撤销该用户所有 Refresh Token');
    }

    // Rotate: revoke current token and issue a new pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({ id: payload.userId, username: stored.user.username, tokenVersion: stored.user.tokenVersion });
  }

  async logout(user: JwtUser, accessToken: string): Promise<void> {
    // Blacklist current access token's jti until it expires.
    const decoded = this.jwt.decode(accessToken) as { exp?: number; jti?: string } | null;
    if (decoded?.exp && decoded?.jti) {
      const ttlSec = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
      try {
        await this.redis.set(`jwt:blacklist:jti:${decoded.jti}`, '1', 'EX', ttlSec);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Redis blacklist write failed during logout for userId=${user.userId}, jti=${decoded.jti}. Access token may remain valid until expiry. ${message}`,
        );
      }
    }

    // Revoke all refresh tokens for the user.
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  decodeToken(token: string): Record<string, unknown> {
    const decoded = this.jwt.decode(token);
    if (typeof decoded === 'string') return { raw: decoded };
    if (decoded && typeof decoded === 'object') return decoded as Record<string, unknown>;
    return {};
  }
}
