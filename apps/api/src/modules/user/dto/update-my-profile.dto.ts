import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

function normalizeRequiredText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class UpdateMyProfileDto {
  @Transform(({ value }) => normalizeRequiredText(value))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username!: string;

  @Transform(({ value }) => normalizeOptionalText(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(64)
  email?: string;
}

