import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { UserRoles } from '../../../shared/authz/user-role';

function normalizeRequiredText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export class AdminCreateUserDto {
  @Transform(({ value }) => normalizeRequiredText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  encryptedPassword?: string;

  @IsOptional()
  @IsString()
  passwordKeyId?: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(UserRoles)
  role?: (typeof UserRoles)[number];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
