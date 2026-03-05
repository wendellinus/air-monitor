import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionService } from '../../modules/permission/permission.service';
import { AppError } from '../app-error';
import { ErrorCodes } from '../error-codes';
import type { UserRole } from './user-role';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();

    const role = req.user?.role;
    if (!role) {
      throw new AppError(ErrorCodes.Unauthorized, '未登录或登录已失效');
    }

    const granted = await this.permissions.getMyPermissionKeys(role);
    const grantedSet = new Set(granted);
    const allGranted = required.every((item) => grantedSet.has(item));
    if (!allGranted) {
      throw new AppError(ErrorCodes.Unauthorized, '权限不足');
    }

    return true;
  }
}
