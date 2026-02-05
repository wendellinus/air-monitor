import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { JwtUser } from './types';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUser => {
  const req = ctx.switchToHttp().getRequest<{ user?: JwtUser }>();
  if (!req.user) {
    // This should not happen when JwtAuthGuard is used.
    throw new Error('请求上下文缺少用户信息');
  }
  return req.user;
});
