import type { UserRole } from '../../shared/authz/user-role';

export type JwtUser = {
  userId: number;
  username: string;
  jti: string;
  role: UserRole;
};
