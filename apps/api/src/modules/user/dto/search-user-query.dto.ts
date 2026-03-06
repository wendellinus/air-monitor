import type { UserRole } from '@air-monitor/shared';
import { UserRoles } from '@air-monitor/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

import { PageQueryDto } from './page-query.dto';

function normalizeBoolQuery(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

export class SearchUserQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(UserRoles)
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }) => normalizeBoolQuery(value))
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}
