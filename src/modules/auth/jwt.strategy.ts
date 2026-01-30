import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type Redis from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { REDIS_CLIENT } from '../../infra/redis/redis.constants';
import { AppError } from '../../shared/app-error';
import { EnvService } from '../../shared/env/env.service';
import { ErrorCodes } from '../../shared/error-codes';

import type { JwtUser } from './types';

type JwtPayload = {
  userId: number;
  username: string;
  jti: string;
  ver: number;
  exp: number;
  iat: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    env: EnvService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    const key = `jwt:blacklist:jti:${payload.jti}`;
    const exists = await this.redis.get(key);
    if (exists) {
      throw new AppError(ErrorCodes.Unauthorized, '账号已退出登录');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, isActive: true, role: true, tokenInvalidBefore: true, tokenVersion: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throw new AppError(ErrorCodes.Unauthorized, '账号不存在或已删除');
    }
    if (!user.isActive) {
      throw new AppError(ErrorCodes.Unauthorized, '账号已禁用');
    }
    if (payload.ver !== user.tokenVersion) {
      throw new AppError(ErrorCodes.Unauthorized, '登录已失效，请重新登录');
    }
    if (user.tokenInvalidBefore) {
      // JWT iat is second-level; compare at second precision to avoid false negatives within the same second.
      const invalidBeforeSec = Math.floor(user.tokenInvalidBefore.getTime() / 1000);
      if (payload.iat < invalidBeforeSec) {
        throw new AppError(ErrorCodes.Unauthorized, '登录已失效，请重新登录');
      }
    }

    return { userId: user.id, username: user.username, jti: payload.jti, role: user.role };
  }
}
