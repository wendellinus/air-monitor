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
      .getRequest<{ user?: { userId?: number; role?: UserRole } }>();

    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new AppError(ErrorCodes.Unauthorized, 'Authentication required.');
    }

    const granted = await this.permissions.getMyPermissionKeys(userId, role);
    const grantedSet = new Set(granted);
    const allGranted = required.every((item) => grantedSet.has(item));
    if (!allGranted) {
      throw new AppError(ErrorCodes.Unauthorized, 'Insufficient permissions.');
    }

    return true;
  }
}
