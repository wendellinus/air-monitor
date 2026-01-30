import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppError } from '../app-error';
import { ErrorCodes } from '../error-codes';

import { ROLES_KEY } from './roles.decorator';
import type { UserRole } from './user-role';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();

    const role = req.user?.role;
    if (!role) {
      throw new AppError(ErrorCodes.Unauthorized, '未登录或登录已失效');
    }

    if (!roles.includes(role)) {
      throw new AppError(ErrorCodes.Unauthorized, '权限不足');
    }

    return true;
  }
}

