import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsString, MaxLength, MinLength } from 'class-validator';

function normalizeRequiredText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export class UpdateAdminUserDetailDto {
  @Transform(({ value }) => normalizeRequiredText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username!: string;

  @IsBoolean()
  isActive!: boolean;

  @IsArray()
  @IsString({ each: true })
  deniedPermissionKeys!: string[];
}
