import { IsIn } from 'class-validator';
import { UserRoles, type UserRole } from '../../../shared/authz/user-role';

export class RoleParamDto {
  @IsIn(UserRoles)
  role!: UserRole;
}
