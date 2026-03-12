import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(JwtStrategy.name);

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
    let exists: string | null = null;
    try {
      exists = await this.redis.get(`jwt:blacklist:jti:${payload.jti}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Redis blacklist lookup failed for userId=${payload.userId}, jti=${payload.jti}. Falling back to DB-only token validation. ${message}`,
      );
    }

    if (exists) {
      throw new AppError(ErrorCodes.Unauthorized, '\u8d26\u53f7\u5df2\u9000\u51fa\u767b\u5f55');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        isActive: true,
        role: true,
        tokenInvalidBefore: true,
        tokenVersion: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError(ErrorCodes.Unauthorized, '\u8d26\u53f7\u4e0d\u5b58\u5728\u6216\u5df2\u5220\u9664');
    }
    if (!user.isActive) {
      throw new AppError(ErrorCodes.Unauthorized, '\u8d26\u53f7\u5df2\u7981\u7528\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458');
    }
    if (payload.ver !== user.tokenVersion) {
      throw new AppError(ErrorCodes.Unauthorized, '\u767b\u5f55\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55');
    }
    if (user.tokenInvalidBefore) {
      const invalidBeforeSec = Math.floor(user.tokenInvalidBefore.getTime() / 1000);
      if (payload.iat < invalidBeforeSec) {
        throw new AppError(ErrorCodes.Unauthorized, '\u767b\u5f55\u5df2\u5931\u6548\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55');
      }
    }

    return { userId: user.id, username: user.username, jti: payload.jti, role: user.role };
  }
}
