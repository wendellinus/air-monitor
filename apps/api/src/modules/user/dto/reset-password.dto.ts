import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  @ValidateIf((value: ResetPasswordDto) => value.newPassword !== undefined)
  @MinLength(6)
  newPassword?: string;

  @IsOptional()
  @IsString()
  encryptedNewPassword?: string;

  @IsOptional()
  @IsString()
  passwordKeyId?: string;
}
